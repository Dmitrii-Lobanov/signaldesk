import { randomUUID } from 'node:crypto';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { DataSource } from 'typeorm';
import { useFeedbackFixture } from './support/feedback-fixture.js';

describe('Feedback API (e2e)', () => {
  let app: INestApplication;
  let database: DataSource;
  let workspaceId: string;
  let otherWorkspaceId: string;
  let feedbackUrl: string;
  let otherFeedbackUrl: string;
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
      otherFeedbackUrl,
      editorCookie,
      viewerCookie,
      content,
    } = fixture);
  });

  it('lets an editor create and list feedback', async () => {
    const created = await request(app.getHttpServer())
      .post(feedbackUrl)
      .set('Cookie', editorCookie)
      .send({ content })
      .expect(201);

    expect(created.body.content).toBe(content);
    expect(created.body.id).toBeTruthy();

    const listed = await request(app.getHttpServer())
      .get(feedbackUrl)
      .set('Cookie', editorCookie)
      .expect(200);

    expect(listed.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: created.body.id,
          content,
        }),
      ]),
    );
  });

  it('lets a viewer read but rejects a viewer write', async () => {
    await request(app.getHttpServer())
      .get(feedbackUrl)
      .set('Cookie', viewerCookie)
      .expect(200);

    const before = await database.query(
      'SELECT count(*) FROM feedback WHERE content = $1',
      ['Viewer write must fail'],
    );

    await request(app.getHttpServer())
      .post(feedbackUrl)
      .set('Cookie', viewerCookie)
      .send({ content: 'Viewer write must fail' })
      .expect(403);

    const after = await database.query(
      'SELECT count(*) FROM feedback WHERE content = $1',
      ['Viewer write must fail'],
    );
    expect(after[0].count).toBe(before[0].count);
  });

  it('rejects reads and writes in another workspace', async () => {
    await request(app.getHttpServer())
      .get(otherFeedbackUrl)
      .set('Cookie', editorCookie)
      .expect(403);

    await request(app.getHttpServer())
      .post(otherFeedbackUrl)
      .set('Cookie', editorCookie)
      .send({ content: 'Cross-workspace write must fail' })
      .expect(403);

    const rows = await database.query(
      'SELECT count(*) FROM feedback WHERE workspace_id = $1',
      [otherWorkspaceId],
    );
    expect(rows[0].count).toBe('0');
  });

  it('lets editors and viewers read feedback detail', async () => {
    const created = await request(app.getHttpServer())
      .post(feedbackUrl)
      .set('Cookie', editorCookie)
      .send({ content })
      .expect(201);

    for (const cookie of [editorCookie, viewerCookie]) {
      const response = await request(app.getHttpServer())
        .get(`${feedbackUrl}/${created.body.id}`)
        .set('Cookie', cookie)
        .expect(200);

      expect(response.body).toEqual(created.body);
    }
  });

  it('rejects anonymous detail requests', async () => {
    await request(app.getHttpServer())
      .get(`${feedbackUrl}/${randomUUID()}`)
      .expect(401);
  });

  it('returns 404 for missing feedback and 400 for an invalid ID', async () => {
    await request(app.getHttpServer())
      .get(`${feedbackUrl}/${randomUUID()}`)
      .set('Cookie', editorCookie)
      .expect(404);

    await request(app.getHttpServer())
      .get(`${feedbackUrl}/not-a-uuid`)
      .set('Cookie', editorCookie)
      .expect(400);
  });

  it('rejects detail access through another workspace URL', async () => {
    const created = await request(app.getHttpServer())
      .post(feedbackUrl)
      .set('Cookie', editorCookie)
      .send({ content })
      .expect(201);

    await request(app.getHttpServer())
      .get(`${otherFeedbackUrl}/${created.body.id}`)
      .set('Cookie', editorCookie)
      .expect(403);
  });

  it('does not expose foreign feedback through an authorized workspace URL', async () => {
    const foreignId = randomUUID();

    await database.query(
      `INSERT INTO feedback (id, workspace_id, content)
       VALUES ($1, $2, $3)`,
      [foreignId, otherWorkspaceId, content],
    );

    try {
      for (const cookie of [editorCookie, viewerCookie]) {
        await request(app.getHttpServer())
          .get(`${feedbackUrl}/${foreignId}`)
          .set('Cookie', cookie)
          .expect(404);
      }
    } finally {
      await database.query('DELETE FROM feedback WHERE id = $1', [foreignId]);
    }
  });

  it('rejects whitespace-only feedback without saving it', async () => {
    const before = await database.query('SELECT count(*) FROM feedback');

    const response = await request(app.getHttpServer())
      .post(feedbackUrl)
      .set('Cookie', editorCookie)
      .send({ content: '   ' })
      .expect(400);

    expect(response.body.message).toContain('Feedback must not be empty');

    const after = await database.query('SELECT count(*) FROM feedback');
    expect(after[0].count).toBe(before[0].count);
  });
});
