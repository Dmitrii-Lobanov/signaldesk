import { randomUUID } from 'node:crypto';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { DataSource } from 'typeorm';
import { useFeedbackFixture } from './support/feedback-fixture.js';

describe('Feedback pagination API (e2e)', () => {
  let app: INestApplication;
  let database: DataSource;
  let workspaceId: string;
  let otherWorkspaceId: string;
  let feedbackUrl: string;
  let otherFeedbackUrl: string;
  let editorCookie: string;
  let viewerCookie: string;

  useFeedbackFixture((fixture) => {
    ({
      app,
      database,
      workspaceId,
      otherWorkspaceId,
      feedbackUrl,
      otherFeedbackUrl,
      editorCookie,
      viewerCookie,
    } = fixture);
  });

  it('returns every matching row once, including rows with tied timestamps', async () => {
    const marker = `pagination-${randomUUID()}`;
    const timestamps = [
      '2026-10-01T12:00:05.000001Z',
      '2026-10-01T12:00:04.000001Z',
      '2026-10-01T12:00:04.000001Z',
      '2026-10-01T12:00:02.000001Z',
      '2026-10-01T12:00:01.000001Z',
    ];

    for (const [index, timestamp] of timestamps.entries()) {
      await database.query(
        `INSERT INTO feedback (id, workspace_id, content, created_at)
         VALUES ($1, $2, $3, $4)`,
        [randomUUID(), workspaceId, `${marker} row ${index}`, timestamp],
      );
    }

    const expectedRows = (await database.query(
      `SELECT id FROM feedback
       WHERE workspace_id = $1 AND content LIKE $2
       ORDER BY created_at DESC, id DESC`,
      [workspaceId, `${marker}%`],
    )) as Array<{ id: string }>;
    const expectedIds = expectedRows.map((row) => row.id);

    const seenIds: string[] = [];
    let cursor: string | null = null;

    do {
      const response: request.Response = await request(app.getHttpServer())
        .get(`${feedbackUrl}/page`)
        .set('Cookie', viewerCookie)
        .query({ q: marker, limit: 2, ...(cursor ? { cursor } : {}) })
        .expect(200);

      expect(response.body.items.length).toBeGreaterThan(0);
      expect(response.body.items.length).toBeLessThanOrEqual(2);
      seenIds.push(
        ...response.body.items.map((item: { id: string }) => item.id),
      );
      cursor = response.body.nextCursor;
    } while (cursor);

    expect(seenIds).toEqual(expectedIds);
    expect(new Set(seenIds).size).toBe(expectedIds.length);
    expect(seenIds).toHaveLength(5);
  });

  it('applies area, tag and text filters together', async () => {
    const areaId = randomUUID();
    const tagId = randomUUID();
    const marker = `filtered-${randomUUID()}`;

    await database.query(
      `INSERT INTO product_areas (id, workspace_id, name)
       VALUES ($1, $2, $3)`,
      [areaId, workspaceId, `Area ${marker}`],
    );
    await database.query(
      `INSERT INTO tags (id, workspace_id, name)
       VALUES ($1, $2, $3)`,
      [tagId, workspaceId, `Tag ${marker}`],
    );

    const matching = await request(app.getHttpServer())
      .post(feedbackUrl)
      .set('Cookie', editorCookie)
      .send({ content: `${marker} matching` })
      .expect(201);
    const unclassified = await request(app.getHttpServer())
      .post(feedbackUrl)
      .set('Cookie', editorCookie)
      .send({ content: `${marker} unclassified` })
      .expect(201);

    await request(app.getHttpServer())
      .patch(`${feedbackUrl}/${matching.body.id}/classification`)
      .set('Cookie', editorCookie)
      .send({ productAreaId: areaId, tagIds: [tagId], expectedVersion: 1 })
      .expect(200);

    const response = await request(app.getHttpServer())
      .get(`${feedbackUrl}/page`)
      .set('Cookie', viewerCookie)
      .query({ q: marker, productAreaId: areaId, tagId })
      .expect(200);

    expect(response.body.items.map((item: { id: string }) => item.id)).toEqual([
      matching.body.id,
    ]);
    expect(response.body.nextCursor).toBeNull();
    expect(
      response.body.items.map((item: { id: string }) => item.id),
    ).not.toContain(unclassified.body.id);
  });

  it('rejects invalid pagination input and cross-workspace access', async () => {
    await request(app.getHttpServer()).get(`${feedbackUrl}/page`).expect(401);

    await request(app.getHttpServer())
      .get(`${otherFeedbackUrl}/page`)
      .set('Cookie', editorCookie)
      .expect(403);

    for (const query of [{ limit: 0 }, { limit: 51 }, { cursor: 'invalid' }]) {
      await request(app.getHttpServer())
        .get(`${feedbackUrl}/page`)
        .set('Cookie', viewerCookie)
        .query(query)
        .expect(400);
    }

    const foreignId = randomUUID();
    await database.query(
      `INSERT INTO feedback (id, workspace_id, content)
       VALUES ($1, $2, $3)`,
      [foreignId, otherWorkspaceId, 'Foreign workspace feedback'],
    );

    const response = await request(app.getHttpServer())
      .get(`${feedbackUrl}/page`)
      .set('Cookie', viewerCookie)
      .query({ q: 'Foreign workspace feedback' })
      .expect(200);

    expect(response.body.items).toEqual([]);
  });
});
