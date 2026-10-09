import { randomUUID } from 'node:crypto';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { DataSource } from 'typeorm';
import { ClassificationSuggestionAdapter } from '../src/feedback/classification-suggestion.adapter.js';
import { useFeedbackFixture } from './support/feedback-fixture.js';

describe('Classification suggestion API (e2e)', () => {
  let app: INestApplication;
  let database: DataSource;
  let workspaceId: string;
  let otherWorkspaceId: string;
  let feedbackUrl: string;
  let editorCookie: string;
  let viewerCookie: string;
  let content: string;

  useFeedbackFixture((fixture) => {
    ({
      app,
      database,
      workspaceId,
      otherWorkspaceId,
      feedbackUrl,
      editorCookie,
      viewerCookie,
      content,
    } = fixture);
  });

  afterEach(() => vi.restoreAllMocks());

  it('suggests without saving, enforces access and limits, and rejects stale acceptance', async () => {
    const areaId = randomUUID();
    const tagId = randomUUID();

    await database.query(
      'INSERT INTO product_areas (id, workspace_id, name) VALUES ($1, $2, $3)',
      [areaId, workspaceId, 'E2E reporting'],
    );
    await database.query(
      'INSERT INTO tags (id, workspace_id, name) VALUES ($1, $2, $3)',
      [tagId, workspaceId, 'E2E usability'],
    );

    const created = await request(app.getHttpServer())
      .post(feedbackUrl)
      .set('Cookie', editorCookie)
      .send({ content })
      .expect(201);

    const itemUrl = `${feedbackUrl}/${created.body.id}`;
    const suggestionUrl = `${itemUrl}/classification-suggestion`;
    const classificationUrl = `${itemUrl}/classification`;

    const adapter = vi
      .spyOn(app.get(ClassificationSuggestionAdapter), 'suggest')
      .mockImplementation(async (_content, version) => ({
        productAreaId: areaId,
        tagIds: [tagId],
        feedbackVersion: version,
        model: 'test-model',
        promptVersion: 'test-v1',
        latencyMs: 1,
        inputTokens: 10,
        outputTokens: 5,
        estimatedCostUsd: 0,
      }));

    await request(app.getHttpServer()).post(suggestionUrl).expect(401);
    await request(app.getHttpServer())
      .post(suggestionUrl)
      .set('Cookie', viewerCookie)
      .expect(403);
    await request(app.getHttpServer())
      .post(
        `/workspaces/${otherWorkspaceId}/feedback/${created.body.id}/classification-suggestion`,
      )
      .set('Cookie', editorCookie)
      .expect(403);
    expect(adapter).not.toHaveBeenCalled();

    const suggested = await request(app.getHttpServer())
      .post(suggestionUrl)
      .set('Cookie', editorCookie)
      .expect(201);

    expect(suggested.body).toMatchObject({
      productAreaId: areaId,
      tagIds: [tagId],
      feedbackVersion: 1,
    });

    const classification = await request(app.getHttpServer())
      .get(classificationUrl)
      .set('Cookie', viewerCookie)
      .expect(200);
    expect(classification.body).toMatchObject({
      productAreaId: null,
      tagIds: [],
      version: 1,
    });

    const history = await request(app.getHttpServer())
      .get(`${itemUrl}/history`)
      .set('Cookie', editorCookie)
      .expect(200);
    expect(history.body.map((event: { action: string }) => event.action)).toEqual([
      'feedback.created',
    ]);

    await request(app.getHttpServer())
      .patch(itemUrl)
      .set('Cookie', editorCookie)
      .send({ content: `${content} updated`, expectedVersion: 1 })
      .expect(200);

    await request(app.getHttpServer())
      .patch(classificationUrl)
      .set('Cookie', editorCookie)
      .send({
        productAreaId: suggested.body.productAreaId,
        tagIds: suggested.body.tagIds,
        expectedVersion: suggested.body.feedbackVersion,
      })
      .expect(409);

    for (let attempt = 0; attempt < 4; attempt += 1) {
      await request(app.getHttpServer())
        .post(suggestionUrl)
        .set('Cookie', editorCookie)
        .expect(201);
    }

    await request(app.getHttpServer())
      .post(suggestionUrl)
      .set('Cookie', editorCookie)
      .expect(429);
    expect(adapter).toHaveBeenCalledTimes(5);
  });
});