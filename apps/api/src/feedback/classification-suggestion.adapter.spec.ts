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

function geminiResponse(text: string): Response {
  return new Response(
    JSON.stringify({
      modelVersion: 'gemini-3.8-flash',
      candidates: [
        {
          finishReason: 'STOP',
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

function groqResponse(text: string): Response {
  return new Response(
    JSON.stringify({
      model: 'openai/gpt-oss-20b',
      choices: [
        {
          finish_reason: 'stop',
          message: { content: text },
        },
      ],
      usage: { prompt_tokens: 90, completion_tokens: 15 },
    }),
    { status: 200 },
  );
}

const validOutput = JSON.stringify({
  productAreaId: area.id,
  tagIds: [tag.id],
});

describe('ClassificationSuggestionAdapter', () => {
  const adapter = new ClassificationSuggestionAdapter();

  beforeEach(() => {
    vi.stubEnv('GEMINI_API_KEY', 'test-gemini-key');
    vi.stubEnv('GROQ_API_KEY', 'test-groq-key');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('uses Gemini when it returns a valid suggestion', async () => {
    const fetchMock = vi.fn().mockResolvedValue(geminiResponse(validOutput));
    vi.stubGlobal('fetch', fetchMock);

    const result = await adapter.suggest('x'.repeat(3000), 7, [area], [tag]);

    expect(result).toMatchObject({
      productAreaId: area.id,
      tagIds: [tag.id],
      feedbackVersion: 7,
      model: 'gemini-3.8-flash',
      inputTokens: 100,
      outputTokens: 20,
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const body = JSON.parse(
      (fetchMock.mock.calls[0][1] as RequestInit).body as string,
    ) as {
      contents: Array<{ parts: Array<{ text: string }> }>;
    };
    const supplied = JSON.parse(body.contents[0].parts[0].text) as {
      feedback: string;
    };
    expect(supplied.feedback).toHaveLength(2500);
  });

  it('does not fall back for a valid null and empty suggestion', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        geminiResponse(JSON.stringify({ productAreaId: null, tagIds: [] })),
      );
    vi.stubGlobal('fetch', fetchMock);

    const result = await adapter.suggest(
      'No matching category',
      1,
      [area],
      [tag],
    );

    expect(result.productAreaId).toBeNull();
    expect(result.tagIds).toEqual([]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('uses Groq after a Gemini service failure', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response('', { status: 503 }))
      .mockResolvedValueOnce(groqResponse(validOutput));
    vi.stubGlobal('fetch', fetchMock);

    const result = await adapter.suggest(
      'Synthetic feedback',
      2,
      [area],
      [tag],
    );

    expect(result).toMatchObject({
      productAreaId: area.id,
      tagIds: [tag.id],
      feedbackVersion: 2,
      model: 'openai/gpt-oss-20b',
      promptVersion: 'classification-groq-gpt-oss-20b-v1',
      inputTokens: 90,
      outputTokens: 15,
      estimatedCostUsd: null,
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1][0]).toBe(
      'https://api.groq.com/openai/v1/chat/completions',
    );

    const body = JSON.parse(
      (fetchMock.mock.calls[1][1] as RequestInit).body as string,
    ) as {
      response_format: {
        json_schema: { strict: boolean };
      };
    };
    expect(body.response_format.json_schema.strict).toBe(true);
  });

  it('uses Groq after Gemini returns an invalid workspace choice', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        geminiResponse(
          JSON.stringify({
            productAreaId: '44444444-4444-4444-8444-444444444444',
            tagIds: [],
          }),
        ),
      )
      .mockResolvedValueOnce(groqResponse(validOutput));
    vi.stubGlobal('fetch', fetchMock);

    const result = await adapter.suggest(
      'Synthetic feedback',
      1,
      [area],
      [tag],
    );

    expect(result.model).toBe('openai/gpt-oss-20b');
    expect(result.productAreaId).toBe(area.id);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('uses Groq directly when Gemini is not configured', async () => {
    vi.stubEnv('GEMINI_API_KEY', '');
    const fetchMock = vi.fn().mockResolvedValue(groqResponse(validOutput));
    vi.stubGlobal('fetch', fetchMock);

    const result = await adapter.suggest(
      'Synthetic feedback',
      1,
      [area],
      [tag],
    );

    expect(result.model).toBe('openai/gpt-oss-20b');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('falls back to manual classification when both providers fail', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error('Provider outage'));
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      adapter.suggest('Synthetic feedback', 1, [area], [tag]),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('rejects invalid Groq output after Gemini fails', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response('', { status: 503 }))
      .mockResolvedValueOnce(
        groqResponse(
          JSON.stringify({
            productAreaId: area.id,
            tagIds: ['66666666-6666-4666-8666-666666666666'],
          }),
        ),
      );
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      adapter.suggest('Synthetic feedback', 1, [area], [tag]),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });
});
