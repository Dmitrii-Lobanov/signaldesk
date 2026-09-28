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
  let sessionCookie: string;

  const content = `Integration test feedback ${Date.now()}`;
  const email = `feedback-test-${Date.now()}@example.invalid`;
  const password = 'Test-only-password-123!';

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
      ['11111111-1111-4111-8111-111111111111', 'E2E workspace'],
    );

    // This auth instance exists only inside the test. The application
    // auth instance still has public sign-up disabled.
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
        name: 'Feedback test editor',
        email,
        password,
      },
    });

    const signIn = await request(app.getHttpServer())
      .post('/api/auth/sign-in/email')
      .send({ email, password })
      .expect(200);

    const setCookie = signIn.headers['set-cookie'];
    if (!setCookie) {
      throw new Error('Sign-in did not set a session cookie');
    }

    sessionCookie = (
      Array.isArray(setCookie) ? setCookie[0] : setCookie
    ).split(';')[0];
  });

  afterAll(async () => {
    if (database) {
      await database.query('DELETE FROM feedback WHERE content = $1', [
        content,
      ]);
      await database.query('DELETE FROM "user" WHERE "email" = $1', [email]);
    }

    await fixturePool?.end();
    await app?.close();
  });

  it('rejects anonymous requests', async () => {
    await request(app.getHttpServer()).get('/me').expect(401);
    await request(app.getHttpServer()).get('/feedback').expect(401);
    await request(app.getHttpServer())
      .post('/feedback')
      .send({ content })
      .expect(401);
  });

  it('identifies the signed-in user', async () => {
    const response = await request(app.getHttpServer())
      .get('/me')
      .set('Cookie', sessionCookie)
      .expect(200);

    expect(response.body).toEqual(
      expect.objectContaining({ email, id: expect.any(String) }),
    );
  });

  it('creates feedback and returns it in the list', async () => {
    const created = await request(app.getHttpServer())
      .post('/feedback')
      .set('Cookie', sessionCookie)
      .send({ content })
      .expect(201);

    expect(created.body.content).toBe(content);
    expect(created.body.id).toBeTruthy();

    const listed = await request(app.getHttpServer())
      .get('/feedback')
      .set('Cookie', sessionCookie)
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

  it('rejects whitespace-only feedback without saving it', async () => {
    const before = await database.query('SELECT count(*) FROM feedback');

    const response = await request(app.getHttpServer())
      .post('/feedback')
      .set('Cookie', sessionCookie)
      .send({ content: '   ' })
      .expect(400);

    expect(response.body.message).toContain('Feedback must not be empty');

    const after = await database.query('SELECT count(*) FROM feedback');
    expect(after[0].count).toBe(before[0].count);
  });
});