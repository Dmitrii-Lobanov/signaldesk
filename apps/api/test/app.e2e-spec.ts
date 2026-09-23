import { ValidationPipe, type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module.js';

describe('Feedback API (e2e)', () => {
  let app: INestApplication;
  let database: DataSource;
  const content = `Integration test feedback ${Date.now()}`;

  beforeAll(async () => {
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl || new URL(databaseUrl).pathname !== '/signaldesk_test') {
      throw new Error('E2E tests require the signaldesk_test database');
    }

    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
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
  });

  afterAll(async () => {
    if (database) {
      await database.query('DELETE FROM feedback WHERE content = $1', [
        content,
      ]);
    }
    await app?.close();
  });

  it('creates feedback and returns it in the list', async () => {
    const created = await request(app.getHttpServer())
      .post('/feedback')
      .send({ content })
      .expect(201);

    expect(created.body.content).toBe(content);
    expect(created.body.id).toBeTruthy();

    const listed = await request(app.getHttpServer())
      .get('/feedback')
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
      .send({ content: '   ' })
      .expect(400);

    expect(response.body.message).toContain('Feedback must not be empty');

    const after = await database.query('SELECT count(*) FROM feedback');
    expect(after[0].count).toBe(before[0].count);
  });
});