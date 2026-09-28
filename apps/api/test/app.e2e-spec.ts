import { randomUUID } from 'node:crypto';
import { ValidationPipe, type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { betterAuth } from 'better-auth';
import { Pool } from 'pg';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module.js';

describe('Feedback API (e2e)', () => {
  let app: INestApplication;
  let database: DataSource;
  let fixturePool: Pool | undefined;
  let editorCookie: string;
  let viewerCookie: string;

  const workspaceId = '11111111-1111-4111-8111-111111111111';
  const otherWorkspaceId = randomUUID();
  const feedbackUrl = `/workspaces/${workspaceId}/feedback`;
  const otherFeedbackUrl = `/workspaces/${otherWorkspaceId}/feedback`;

  const testId = randomUUID();
  const editorEmail = `editor-${testId}@example.invalid`;
  const viewerEmail = `viewer-${testId}@example.invalid`;
  const password = 'Test-only-password-123!';
  const content = `Integration test feedback ${testId}`;

  async function signInAndGetCookie(email: string): Promise<string> {
    const response = await request(app.getHttpServer())
      .post('/api/auth/sign-in/email')
      .send({ email, password })
      .expect(200);

    const setCookie = response.headers['set-cookie'];
    if (!setCookie) {
      throw new Error(`Sign-in did not set a session cookie for ${email}`);
    }

    return (Array.isArray(setCookie) ? setCookie[0] : setCookie).split(';')[0];
  }

  beforeAll(async () => {
    const databaseUrl = process.env.DATABASE_URL;
    const secret = process.env.BETTER_AUTH_SECRET;
    const baseURL = process.env.BETTER_AUTH_URL;

    if (!databaseUrl || new URL(databaseUrl).pathname !== '/signaldesk_test') {
      throw new Error('E2E tests require the signaldesk_test database');
    }

    if (!secret || !baseURL) {
      throw new Error('E2E tests require Better Auth settings');
    }

    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication({ bodyParser: false });
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();

    database = app.get(DataSource);

    await database.query(
      'INSERT INTO workspaces (id, name) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING',
      [workspaceId, 'E2E workspace'],
    );
    await database.query(
      'INSERT INTO workspaces (id, name) VALUES ($1, $2)',
      [otherWorkspaceId, 'Other E2E workspace'],
    );

    // Only this test fixture can create users. The application still has
    // public sign-up disabled.
    fixturePool = new Pool({ connectionString: databaseUrl });
    const fixtureAuth = betterAuth({
      database: fixturePool,
      secret,
      baseURL,
      emailAndPassword: {
        enabled: true,
        autoSignIn: false,
      },
    });

    await fixtureAuth.api.signUpEmail({
      body: {
        name: 'E2E editor',
        email: editorEmail,
        password,
      },
    });
    await fixtureAuth.api.signUpEmail({
      body: {
        name: 'E2E viewer',
        email: viewerEmail,
        password,
      },
    });

    const editorRows = await database.query(
      'SELECT "id" FROM "user" WHERE "email" = $1',
      [editorEmail],
    );
    const viewerRows = await database.query(
      'SELECT "id" FROM "user" WHERE "email" = $1',
      [viewerEmail],
    );

    if (!editorRows[0] || !viewerRows[0]) {
      throw new Error('Test users were not created');
    }

    await database.query(
      `INSERT INTO workspace_memberships
         (workspace_id, user_id, role)
       VALUES ($1, $2, 'editor'), ($1, $3, 'viewer')`,
      [workspaceId, editorRows[0].id, viewerRows[0].id],
    );

    editorCookie = await signInAndGetCookie(editorEmail);
    viewerCookie = await signInAndGetCookie(viewerEmail);
  });

  afterAll(async () => {
    if (database) {
      await database.query('DELETE FROM feedback WHERE content = $1', [
        content,
      ]);
      await database.query(
        'DELETE FROM "user" WHERE "email" IN ($1, $2)',
        [editorEmail, viewerEmail],
      );
      await database.query('DELETE FROM workspaces WHERE id = $1', [
        otherWorkspaceId,
      ]);
    }

    await fixturePool?.end();
    await app?.close();
  });

  it('rejects anonymous requests', async () => {
    await request(app.getHttpServer()).get('/me').expect(401);
    await request(app.getHttpServer()).get(feedbackUrl).expect(401);
    await request(app.getHttpServer())
      .post(feedbackUrl)
      .send({ content })
      .expect(401);
  });

  it('rejects a session after sign-out', async () => {
    const cookie = await signInAndGetCookie(editorEmail);

    await request(app.getHttpServer())
      .post('/api/auth/sign-out')
      .set('Cookie', cookie)
      .send({})
      .expect(200);

    await request(app.getHttpServer())
      .get('/me')
      .set('Cookie', cookie)
      .expect(401);

    await request(app.getHttpServer())
      .get(feedbackUrl)
      .set('Cookie', cookie)
      .expect(401);

    await request(app.getHttpServer())
      .post(feedbackUrl)
      .set('Cookie', cookie)
      .send({ content: 'Revoked session must not write' })
      .expect(401);
  });

  it('identifies the signed-in editor', async () => {
    const response = await request(app.getHttpServer())
      .get('/me')
      .set('Cookie', editorCookie)
      .expect(200);

    expect(response.body).toEqual(
      expect.objectContaining({
        email: editorEmail,
        id: expect.any(String),
      }),
    );
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