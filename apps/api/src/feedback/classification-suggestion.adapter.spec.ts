import { ServiceUnavailableException } from '@nestjs/common';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ClassificationSuggestionAdapter } from './classification-suggestion.adapter.js';
import type { ProductArea } from './entity/product-area.entity.js';
import type { Tag } from './entity/tag.entity.js';

const workspaceId = '11111111-1111-4111-8111-111111111111';
const area = {
  id: '33333333-3333-4333-8333-333333333333',
  workspaceId,
  name: 'Navigation',
} as ProductArea;
const tag = {
  id: '55555555-5555-4555-8555-555555555555',
  workspaceId,
  name: 'Usability',
} as Tag;

function providerResponse(text: string, finishReason = 'STOP'): Response {
  return new Response(
    JSON.stringify({
      modelVersion: 'gemini-3.8-flash',
      candidates: [
        {
          finishReason,
          content: { parts: [{ text }] },
        },
      ],
      usageMetadata: {
        promptTokenCount: 100,
        candidatesTokenCount: 20,
      },
    }),
    { status: 200 },
  );
}

describe('ClassificationSuggestionAdapter', () => {
  const adapter = new ClassificationSuggestionAdapter();

  beforeEach(() => {
    vi.stubEnv('GEMINI_API_KEY', 'test-only-key');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('bounds feedback and returns only validated choices', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      providerResponse(
        JSON.stringify({
          productAreaId: area.id,
          tagIds: [tag.id],
        }),
      ),
    );
    vi.stubGlobal('fetch', fetchMock);

    const suggestion = await adapter.suggest('x'.repeat(3000), 7, [area], [tag]);

    expect(suggestion).toMatchObject({
      productAreaId: area.id,
      tagIds: [tag.id],
      feedbackVersion: 7,
      model: 'gemini-3.8-flash',
      inputTokens: 100,
      outputTokens: 20,
    });

    const request = JSON.parse(
      (fetchMock.mock.calls[0][1] as RequestInit).body as string,
    ) as {
      contents: Array<{ parts: Array<{ text: string }> }>;
      generationConfig: { maxOutputTokens: number };
    };
    const supplied = JSON.parse(request.contents[0].parts[0].text) as {
      feedback: string;
      productAreas: Array<{ id: string }>;
      tags: Array<{ id: string }>;
    };

    expect(supplied.feedback).toHaveLength(2500);
    expect(supplied.productAreas.map((choice) => choice.id)).toEqual([area.id]);
    expect(supplied.tags.map((choice) => choice.id)).toEqual([tag.id]);
    expect(request.generationConfig.maxOutputTokens).toBe(512);
  });

  it('rejects malformed and wrong-workspace output', async () => {
    const invalidOutputs = [
      'not JSON',
      JSON.stringify({
        productAreaId: '44444444-4444-4444-8444-444444444444',
        tagIds: [],
      }),
      JSON.stringify({
        productAreaId: area.id,
        tagIds: ['66666666-6666-4666-8666-666666666666'],
      }),
      JSON.stringify({
        productAreaId: area.id,
        tagIds: [tag.id, tag.id],
      }),
    ];

    for (const output of invalidOutputs) {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue(providerResponse(output)),
      );

      await expect(
        adapter.suggest('Synthetic feedback', 1, [area], [tag]),
      ).rejects.toBeInstanceOf(ServiceUnavailableException);
    }
  });

  it('rejects incomplete output', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(providerResponse('{"tagIds":', 'MAX_TOKENS')),
    );

    await expect(
      adapter.suggest('Synthetic feedback', 1, [area], [tag]),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it('recovers from provider outage', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new Error('Provider unavailable')),
    );

    await expect(
      adapter.suggest('Synthetic feedback', 1, [area], [tag]),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });
});