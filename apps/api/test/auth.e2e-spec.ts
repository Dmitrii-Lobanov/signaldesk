import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { useFeedbackFixture } from './support/feedback-fixture.js';

describe('Auth API (e2e)', () => {
  let app: INestApplication;
  let feedbackUrl: string;
  let editorCookie: string;
  let editorEmail: string;
  let content: string;
  let signInAndGetCookie: (email: string) => Promise<string>;

  useFeedbackFixture((fixture) => {
    ({
      app,
      feedbackUrl,
      editorCookie,
      editorEmail,
      content,
      signInAndGetCookie,
    } = fixture);
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
});
