import { randomUUID } from 'node:crypto';
import { ValidationPipe, type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { betterAuth } from 'better-auth';
import { Pool } from 'pg';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../../src/app.module.js';

export type FeedbackFixture = {
  app: INestApplication;
  database: DataSource;
  workspaceId: string;
  otherWorkspaceId: string;
  feedbackUrl: string;
  otherFeedbackUrl: string;
  editorCookie: string;
  viewerCookie: string;
  editorEmail: string;
  content: string;
  signInAndGetCookie: (email: string) => Promise<string>;
  close: () => Promise<void>;
};

async function createFeedbackFixture(): Promise<FeedbackFixture> {
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

  const app = module.createNestApplication({ bodyParser: false });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );
  await app.init();

  const database = app.get(DataSource);
  const workspaceId = randomUUID();
  const otherWorkspaceId = randomUUID();
  const feedbackUrl = `/workspaces/${workspaceId}/feedback`;
  const otherFeedbackUrl = `/workspaces/${otherWorkspaceId}/feedback`;

  await database.query(
    `INSERT INTO workspaces (id, name)
     VALUES ($1, $2), ($3, $4)`,
    [workspaceId, 'E2E workspace', otherWorkspaceId, 'Other E2E workspace'],
  );

  const testId = randomUUID();
  const editorEmail = `editor-${testId}@example.invalid`;
  const viewerEmail = `viewer-${testId}@example.invalid`;
  const password = 'Test-only-password-123!';
  const content = `Integration test feedback ${testId}`;

  // Only this test fixture creates users. Public sign-up remains disabled.
  const fixturePool = new Pool({ connectionString: databaseUrl });
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
    body: { name: 'E2E editor', email: editorEmail, password },
  });
  await fixtureAuth.api.signUpEmail({
    body: { name: 'E2E viewer', email: viewerEmail, password },
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

  const editorCookie = await signInAndGetCookie(editorEmail);
  const viewerCookie = await signInAndGetCookie(viewerEmail);

  return {
    app,
    database,
    workspaceId,
    otherWorkspaceId,
    feedbackUrl,
    otherFeedbackUrl,
    editorCookie,
    viewerCookie,
    editorEmail,
    content,
    signInAndGetCookie,
    async close() {
      try {
        await database.query(
          'DELETE FROM audit_events WHERE workspace_id IN ($1, $2)',
          [workspaceId, otherWorkspaceId],
        );

        await database.query(
          'DELETE FROM feedback WHERE workspace_id IN ($1, $2)',
          [workspaceId, otherWorkspaceId],
        );
        await database.query(
          'DELETE FROM tags WHERE workspace_id IN ($1, $2)',
          [workspaceId, otherWorkspaceId],
        );
        await database.query(
          'DELETE FROM product_areas WHERE workspace_id IN ($1, $2)',
          [workspaceId, otherWorkspaceId],
        );
        await database.query('DELETE FROM "user" WHERE "email" IN ($1, $2)', [
          editorEmail,
          viewerEmail,
        ]);
        await database.query('DELETE FROM workspaces WHERE id IN ($1, $2)', [
          workspaceId,
          otherWorkspaceId,
        ]);
      } finally {
        await fixturePool.end();
        await app.close();
      }
    },
  };
}

export function useFeedbackFixture(
  assign: (fixture: FeedbackFixture) => void,
): void {
  let fixture: FeedbackFixture | undefined;

  beforeAll(async () => {
    fixture = await createFeedbackFixture();
    assign(fixture);
  });

  afterAll(async () => {
    await fixture?.close();
  });
}
