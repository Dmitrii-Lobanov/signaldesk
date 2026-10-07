import { randomUUID } from 'node:crypto';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { DataSource } from 'typeorm';
import { useFeedbackFixture } from './support/feedback-fixture.js';

describe('Reliable feedback changes (e2e)', () => {
  let app: INestApplication;
  let database: DataSource;
  let workspaceId: string;
  let otherWorkspaceId: string;
  let feedbackUrl: string;
  let otherFeedbackUrl: string;
  let editorCookie: string;
  let viewerCookie: string;
  let editorEmail: string;

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
      editorEmail,
    } = fixture);
  });

  async function create(content: string, requestKey?: string) {
    return request(app.getHttpServer())
      .post(feedbackUrl)
      .set('Cookie', editorCookie)
      .send({ content, ...(requestKey ? { requestKey } : {}) })
      .expect(201);
  }

  it('rolls back an edit when its audit write fails', async () => {
    const original = `Original ${randomUUID()}`;
    const attempted = `Rejected ${randomUUID()}`;
    const created = await create(original);
    const feedbackId = created.body.id as string;
    const suffix = randomUUID().replaceAll('-', '');
    const constraint = `reject_audit_${suffix}`;

    // This constraint rejects only this test's attempted audit payload.
    await database.query(`
      ALTER TABLE audit_events
      ADD CONSTRAINT "${constraint}"
      CHECK (("after"->>'content') IS DISTINCT FROM '${attempted}')
    `);

    try {
      await request(app.getHttpServer())
        .patch(`${feedbackUrl}/${feedbackId}`)
        .set('Cookie', editorCookie)
        .send({ content: attempted, expectedVersion: 1 })
        .expect(500);

      const row = (await database.query(
        'SELECT content, version FROM feedback WHERE workspace_id = $1 AND id = $2',
        [workspaceId, feedbackId],
      )) as Array<{ content: string; version: number }>;

      expect(row).toEqual([{ content: original, version: 1 }]);

      const events = (await database.query(
        `SELECT action FROM audit_events
         WHERE workspace_id = $1 AND feedback_id = $2
         ORDER BY created_at, id`,
        [workspaceId, feedbackId],
      )) as Array<{ action: string }>;

      expect(events).toEqual([{ action: 'feedback.created' }]);
    } finally {
      await database.query(
        `ALTER TABLE audit_events DROP CONSTRAINT "${constraint}"`,
      );
    }
  });

  it('returns one feedback item and one audit event for duplicate create submissions', async () => {
    const content = `Retry ${randomUUID()}`;
    const requestKey = randomUUID();

    const [first, retry] = await Promise.all([
      create(content, requestKey),
      create(content, requestKey),
    ]);

    expect(retry.body.id).toBe(first.body.id);

    const rows = (await database.query(
      `SELECT id FROM feedback
       WHERE workspace_id = $1 AND create_request_key = $2`,
      [workspaceId, requestKey],
    )) as Array<{ id: string }>;

    expect(rows).toEqual([{ id: first.body.id }]);

    const events = (await database.query(
      `SELECT action FROM audit_events
       WHERE workspace_id = $1 AND feedback_id = $2`,
      [workspaceId, first.body.id],
    )) as Array<{ action: string }>;

    expect(events).toEqual([{ action: 'feedback.created' }]);

    await request(app.getHttpServer())
      .post(feedbackUrl)
      .set('Cookie', editorCookie)
      .send({ content: `${content} changed`, requestKey })
      .expect(409);
  });

  it('rejects a stale edit and exposes traceable evidence for the successful edit', async () => {
    const original = `Before ${randomUUID()}`;
    const changed = `After ${randomUUID()}`;
    const created = await create(original);
    const feedbackId = created.body.id as string;
    const url = `${feedbackUrl}/${feedbackId}`;

    const saved = await request(app.getHttpServer())
      .patch(url)
      .set('Cookie', editorCookie)
      .send({ content: changed, expectedVersion: 1 })
      .expect(200);

    expect(saved.body).toEqual(
      expect.objectContaining({ id: feedbackId, content: changed, version: 2 }),
    );

    await request(app.getHttpServer())
      .patch(url)
      .set('Cookie', editorCookie)
      .send({ content: 'Stale overwrite', expectedVersion: 1 })
      .expect(409);

    const detail = await request(app.getHttpServer())
      .get(url)
      .set('Cookie', viewerCookie)
      .expect(200);

    expect(detail.body.content).toBe(changed);
    expect(detail.body.version).toBe(2);

    const history = await request(app.getHttpServer())
      .get(`${url}/history`)
      .set('Cookie', viewerCookie)
      .expect(200);

    expect(history.body).toHaveLength(2);
    expect(history.body[0]).toEqual(
      expect.objectContaining({
        feedbackId,
        actorEmail: editorEmail,
        action: 'feedback.edited',
        before: { content: original, version: 1 },
        after: { content: changed, version: 2 },
      }),
    );
    expect(history.body[1].action).toBe('feedback.created');
  });

  it('enforces API authorization and workspace isolation for edits and history', async () => {
    const created = await create(`Own ${randomUUID()}`);
    const feedbackId = created.body.id as string;
    const ownUrl = `${feedbackUrl}/${feedbackId}`;
    const otherUrl = `${otherFeedbackUrl}/${feedbackId}`;
    const edit = { content: 'Unauthorized change', expectedVersion: 1 };

    await request(app.getHttpServer()).patch(ownUrl).send(edit).expect(401);
    await request(app.getHttpServer())
      .patch(ownUrl)
      .set('Cookie', viewerCookie)
      .send(edit)
      .expect(403);
    await request(app.getHttpServer())
      .patch(otherUrl)
      .set('Cookie', editorCookie)
      .send(edit)
      .expect(403);
    await request(app.getHttpServer())
      .get(`${otherUrl}/history`)
      .set('Cookie', editorCookie)
      .expect(403);
    await request(app.getHttpServer()).get(`${ownUrl}/history`).expect(401);

    const foreignId = randomUUID();
    await database.query(
      'INSERT INTO feedback (id, workspace_id, content) VALUES ($1, $2, $3)',
      [foreignId, otherWorkspaceId, 'Foreign feedback'],
    );

    await request(app.getHttpServer())
      .patch(`${feedbackUrl}/${foreignId}`)
      .set('Cookie', editorCookie)
      .send(edit)
      .expect(404);
    await request(app.getHttpServer())
      .get(`${feedbackUrl}/${foreignId}/history`)
      .set('Cookie', editorCookie)
      .expect(404);

    const own = await request(app.getHttpServer())
      .get(ownUrl)
      .set('Cookie', editorCookie)
      .expect(200);
    expect(own.body.content).toBe(created.body.content);

    const events = (await database.query(
      `SELECT action FROM audit_events
       WHERE workspace_id = $1 AND feedback_id = $2`,
      [workspaceId, feedbackId],
    )) as Array<{ action: string }>;
    expect(events).toEqual([{ action: 'feedback.created' }]);
  });
});
