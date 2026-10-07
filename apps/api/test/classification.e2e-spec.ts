import { randomUUID } from 'node:crypto';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { DataSource } from 'typeorm';
import { useFeedbackFixture } from './support/feedback-fixture.js';

describe('Classification API (e2e)', () => {
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

  it('lists only this workspace’s product areas and tags for editors and viewers', async () => {
    const ownAreaId = randomUUID();
    const foreignAreaId = randomUUID();
    const ownTagId = randomUUID();
    const foreignTagId = randomUUID();

    await database.query(
      `INSERT INTO product_areas (id, workspace_id, name)
         VALUES ($1, $2, $3), ($4, $5, $6)`,
      [
        ownAreaId,
        workspaceId,
        'E2E navigation',
        foreignAreaId,
        otherWorkspaceId,
        'E2E foreign navigation',
      ],
    );

    await database.query(
      `INSERT INTO tags (id, workspace_id, name)
         VALUES ($1, $2, $3), ($4, $5, $6)`,
      [
        ownTagId,
        workspaceId,
        'E2E usability',
        foreignTagId,
        otherWorkspaceId,
        'E2E foreign usability',
      ],
    );

    try {
      for (const cookie of [editorCookie, viewerCookie]) {
        const areas = await request(app.getHttpServer())
          .get(`/workspaces/${workspaceId}/product-areas`)
          .set('Cookie', cookie)
          .expect(200);

        expect(areas.body).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              id: ownAreaId,
              workspaceId,
              name: 'E2E navigation',
            }),
          ]),
        );
        expect(areas.body).not.toEqual(
          expect.arrayContaining([
            expect.objectContaining({ id: foreignAreaId }),
          ]),
        );

        const tags = await request(app.getHttpServer())
          .get(`/workspaces/${workspaceId}/tags`)
          .set('Cookie', cookie)
          .expect(200);

        expect(tags.body).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              id: ownTagId,
              workspaceId,
              name: 'E2E usability',
            }),
          ]),
        );
        expect(tags.body).not.toEqual(
          expect.arrayContaining([
            expect.objectContaining({ id: foreignTagId }),
          ]),
        );

        await request(app.getHttpServer())
          .get(`/workspaces/${otherWorkspaceId}/product-areas`)
          .set('Cookie', cookie)
          .expect(403);

        await request(app.getHttpServer())
          .get(`/workspaces/${otherWorkspaceId}/tags`)
          .set('Cookie', cookie)
          .expect(403);
      }

      await request(app.getHttpServer())
        .get(`/workspaces/${workspaceId}/product-areas`)
        .expect(401);

      await request(app.getHttpServer())
        .get(`/workspaces/${workspaceId}/tags`)
        .expect(401);
    } finally {
      await database.query('DELETE FROM tags WHERE id IN ($1, $2)', [
        ownTagId,
        foreignTagId,
      ]);
      await database.query('DELETE FROM product_areas WHERE id IN ($1, $2)', [
        ownAreaId,
        foreignAreaId,
      ]);
    }
  });

  it('classifies feedback only with authorized workspace choices', async () => {
    const ownAreaId = randomUUID();
    const foreignAreaId = randomUUID();
    const ownTagId = randomUUID();
    const foreignTagId = randomUUID();
    const foreignFeedbackId = randomUUID();

    const created = await request(app.getHttpServer())
      .post(feedbackUrl)
      .set('Cookie', editorCookie)
      .send({ content })
      .expect(201);

    const classificationUrl = `${feedbackUrl}/${created.body.id}/classification`;

    await database.query(
      `INSERT INTO product_areas (id, workspace_id, name)
         VALUES ($1, $2, $3), ($4, $5, $6)`,
      [
        ownAreaId,
        workspaceId,
        `Area ${ownAreaId}`,
        foreignAreaId,
        otherWorkspaceId,
        `Area ${foreignAreaId}`,
      ],
    );

    await database.query(
      `INSERT INTO tags (id, workspace_id, name)
         VALUES ($1, $2, $3), ($4, $5, $6)`,
      [
        ownTagId,
        workspaceId,
        `Tag ${ownTagId}`,
        foreignTagId,
        otherWorkspaceId,
        `Tag ${foreignTagId}`,
      ],
    );

    await database.query(
      `INSERT INTO feedback (id, workspace_id, content)
         VALUES ($1, $2, $3)`,
      [foreignFeedbackId, otherWorkspaceId, content],
    );

    try {
      const initial = await request(app.getHttpServer())
        .get(classificationUrl)
        .set('Cookie', viewerCookie)
        .expect(200);

      expect(initial.body).toEqual({
        feedbackId: created.body.id,
        productAreaId: null,
        tagIds: [],
      });

      const saved = await request(app.getHttpServer())
        .patch(classificationUrl)
        .set('Cookie', editorCookie)
        .send({ productAreaId: ownAreaId, tagIds: [ownTagId] })
        .expect(200);

      expect(saved.body).toEqual({
        feedbackId: created.body.id,
        productAreaId: ownAreaId,
        tagIds: [ownTagId],
      });

      await request(app.getHttpServer())
        .patch(classificationUrl)
        .set('Cookie', viewerCookie)
        .send({ productAreaId: null, tagIds: [] })
        .expect(403);

      await request(app.getHttpServer())
        .patch(classificationUrl)
        .send({ productAreaId: null, tagIds: [] })
        .expect(401);

      await request(app.getHttpServer())
        .patch(`${otherFeedbackUrl}/${created.body.id}/classification`)
        .set('Cookie', editorCookie)
        .send({ productAreaId: null, tagIds: [] })
        .expect(403);

      await request(app.getHttpServer())
        .patch(`${feedbackUrl}/${foreignFeedbackId}/classification`)
        .set('Cookie', editorCookie)
        .send({ productAreaId: null, tagIds: [] })
        .expect(404);

      await request(app.getHttpServer())
        .patch(classificationUrl)
        .set('Cookie', editorCookie)
        .send({ productAreaId: foreignAreaId, tagIds: [ownTagId] })
        .expect(404);

      await request(app.getHttpServer())
        .patch(classificationUrl)
        .set('Cookie', editorCookie)
        .send({ productAreaId: null, tagIds: [foreignTagId] })
        .expect(404);

      await request(app.getHttpServer())
        .patch(classificationUrl)
        .set('Cookie', editorCookie)
        .send({ productAreaId: null, tagIds: [ownTagId, ownTagId] })
        .expect(400);

      const afterRejectedWrites = await request(app.getHttpServer())
        .get(classificationUrl)
        .set('Cookie', viewerCookie)
        .expect(200);

      expect(afterRejectedWrites.body).toEqual(saved.body);

      const cleared = await request(app.getHttpServer())
        .patch(classificationUrl)
        .set('Cookie', editorCookie)
        .send({ productAreaId: null, tagIds: [] })
        .expect(200);

      expect(cleared.body).toEqual({
        feedbackId: created.body.id,
        productAreaId: null,
        tagIds: [],
      });
    } finally {
      await database.query('DELETE FROM feedback WHERE id IN ($1, $2)', [
        created.body.id,
        foreignFeedbackId,
      ]);
      await database.query('DELETE FROM tags WHERE id IN ($1, $2)', [
        ownTagId,
        foreignTagId,
      ]);
      await database.query('DELETE FROM product_areas WHERE id IN ($1, $2)', [
        ownAreaId,
        foreignAreaId,
      ]);
    }
  });
});
