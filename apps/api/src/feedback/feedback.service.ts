import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { WorkspaceMembership } from '../workspaces/workspace-membership.entity.js';
import { CreateFeedbackDto } from './dto/create-feedback.dto.js';
import { FeedbackClassificationResponseDto } from './dto/feedback-classification-response.dto.js';
import { UpdateFeedbackClassificationDto } from './dto/update-feedback-classification.dto.js';
import { ProductArea } from './entity/product-area.entity.js';
import { Tag } from './entity/tag.entity.js';
import { FeedbackPageResponseDto } from './dto/feedback-page-response.dto.js';
import { ListFeedbackQueryDto } from './dto/list-feedback-query.dto.js';
import { FeedbackResponseDto } from './dto/feedback-response.dto.js';
import { Feedback } from './entity/feedback.entity.js';

@Injectable()
export class FeedbackService {
  constructor(
    @InjectRepository(Feedback)
    private readonly feedbackRepository: Repository<Feedback>,
    @InjectRepository(WorkspaceMembership)
    private readonly membershipRepository: Repository<WorkspaceMembership>,
    @InjectRepository(ProductArea)
    private readonly productAreaRepository: Repository<ProductArea>,
    @InjectRepository(Tag)
    private readonly tagRepository: Repository<Tag>,
    private readonly dataSource: DataSource,
  ) {}

  private async requireMembership(
    workspaceId: string,
    userId: string,
    requiredRole: 'editor' | 'viewer',
  ): Promise<void> {
    const membership = await this.membershipRepository.findOneBy({
      workspaceId,
      userId,
    });

    if (
      !membership ||
      (requiredRole === 'editor' && membership.role !== 'editor')
    ) {
      throw new ForbiddenException('Workspace access denied');
    }
  }

  async listProductAreas(
    workspaceId: string,
    userId: string,
  ): Promise<ProductArea[]> {
    await this.requireMembership(workspaceId, userId, 'viewer');

    return this.productAreaRepository.find({
      where: { workspaceId },
      order: { name: 'ASC', id: 'ASC' },
    });
  }

  async listTags(workspaceId: string, userId: string): Promise<Tag[]> {
    await this.requireMembership(workspaceId, userId, 'viewer');

    return this.tagRepository.find({
      where: { workspaceId },
      order: { name: 'ASC', id: 'ASC' },
    });
  }

  async page(
    workspaceId: string,
    userId: string,
    query: ListFeedbackQueryDto,
  ): Promise<FeedbackPageResponseDto> {
    await this.requireMembership(workspaceId, userId, 'viewer');

    const limit = query.limit ?? 20;
    const values: unknown[] = [workspaceId];
    const conditions = ['f.workspace_id = $1'];

    if (query.q?.trim()) {
      values.push(query.q.trim());
      conditions.push(`strpos(lower(f.content), lower($${values.length})) > 0`);
    }

    if (query.productAreaId) {
      values.push(query.productAreaId);
      conditions.push(`f.product_area_id = $${values.length}`);
    }

    if (query.tagId) {
      values.push(query.tagId);
      conditions.push(`
        EXISTS (
          SELECT 1
          FROM feedback_tags ft
          WHERE ft.workspace_id = f.workspace_id
            AND ft.feedback_id = f.id
            AND ft.tag_id = $${values.length}
        )
      `);
    }

    if (query.cursor) {
      let decoded: unknown;

      try {
        decoded = JSON.parse(
          Buffer.from(query.cursor, 'base64url').toString('utf8'),
        );
      } catch {
        throw new BadRequestException('Invalid cursor');
      }

      if (
        typeof decoded !== 'object' ||
        decoded === null ||
        !('at' in decoded) ||
        !('id' in decoded) ||
        typeof decoded.at !== 'string' ||
        typeof decoded.id !== 'string' ||
        !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{6}Z$/.test(decoded.at) ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
          decoded.id,
        )
      ) {
        throw new BadRequestException('Invalid cursor');
      }

      values.push(decoded.at, decoded.id);
      conditions.push(
        `(f.created_at, f.id) < ($${values.length - 1}::timestamptz, $${values.length}::uuid)`,
      );
    }

    values.push(limit + 1);

    type PageRow = FeedbackResponseDto & {
      cursorCreatedAt: string;
    };

    const rows = (await this.dataSource.query(
      `
        SELECT
          f.id,
          f.workspace_id AS "workspaceId",
          f.source,
          f.content,
          f.occurred_at AS "occurredAt",
          f.created_at AS "createdAt",
          to_char(
            f.created_at AT TIME ZONE 'UTC',
            'YYYY-MM-DD"T"HH24:MI:SS.US"Z"'
          ) AS "cursorCreatedAt"
        FROM feedback f
        WHERE ${conditions.join(' AND ')}
        ORDER BY f.created_at DESC, f.id DESC
        LIMIT $${values.length}
      `,
      values,
    )) as PageRow[];

    const pageRows = rows.slice(0, limit);
    const items = pageRows.map(({ cursorCreatedAt: _cursor, ...item }) => item);
    const last = pageRows.at(-1);

    const nextCursor =
      rows.length > limit && last
        ? Buffer.from(
            JSON.stringify({
              at: last.cursorCreatedAt,
              id: last.id,
            }),
          ).toString('base64url')
        : null;

    return { items, nextCursor };
  }

  async list(workspaceId: string, userId: string): Promise<Feedback[]> {
    await this.requireMembership(workspaceId, userId, 'viewer');

    return this.feedbackRepository.find({
      where: { workspaceId },
      order: { createdAt: 'DESC', id: 'DESC' },
      take: 50,
    });
  }

  async detail(
    workspaceId: string,
    userId: string,
    feedbackId: string,
  ): Promise<Feedback> {
    await this.requireMembership(workspaceId, userId, 'viewer');

    const feedback = await this.feedbackRepository.findOneBy({
      id: feedbackId,
      workspaceId,
    });

    if (!feedback) {
      throw new NotFoundException('Feedback not found');
    }

    return feedback;
  }

  private async readClassification(
    manager: EntityManager,
    workspaceId: string,
    feedbackId: string,
  ): Promise<FeedbackClassificationResponseDto> {
    const rows = (await manager.query(
      `
        SELECT
          f.id AS "feedbackId",
          f.product_area_id AS "productAreaId",
          COALESCE(
            array_agg(ft.tag_id ORDER BY ft.tag_id)
              FILTER (WHERE ft.tag_id IS NOT NULL),
            '{}'
          ) AS "tagIds"
        FROM feedback f
        LEFT JOIN feedback_tags ft
          ON ft.workspace_id = f.workspace_id
         AND ft.feedback_id = f.id
        WHERE f.workspace_id = $1 AND f.id = $2
        GROUP BY f.id, f.product_area_id
      `,
      [workspaceId, feedbackId],
    )) as FeedbackClassificationResponseDto[];

    if (!rows[0]) {
      throw new NotFoundException('Feedback not found');
    }

    return rows[0];
  }

  async getClassification(
    workspaceId: string,
    userId: string,
    feedbackId: string,
  ): Promise<FeedbackClassificationResponseDto> {
    await this.requireMembership(workspaceId, userId, 'viewer');

    return this.readClassification(
      this.dataSource.manager,
      workspaceId,
      feedbackId,
    );
  }

  async updateClassification(
    workspaceId: string,
    userId: string,
    feedbackId: string,
    dto: UpdateFeedbackClassificationDto,
  ): Promise<FeedbackClassificationResponseDto> {
    await this.requireMembership(workspaceId, userId, 'editor');

    return this.dataSource.transaction(async (manager) => {
      const feedbackRows = (await manager.query(
        `
          SELECT id
          FROM feedback
          WHERE workspace_id = $1 AND id = $2
          FOR UPDATE
        `,
        [workspaceId, feedbackId],
      )) as Array<{ id: string }>;

      if (!feedbackRows[0]) {
        throw new NotFoundException('Feedback not found');
      }

      if (dto.productAreaId !== null) {
        const areaRows = (await manager.query(
          `
            SELECT id
            FROM product_areas
            WHERE workspace_id = $1 AND id = $2
            FOR KEY SHARE
          `,
          [workspaceId, dto.productAreaId],
        )) as Array<{ id: string }>;

        if (!areaRows[0]) {
          throw new NotFoundException('Product area not found');
        }
      }

      if (dto.tagIds.length > 0) {
        const tagRows = (await manager.query(
          `
            SELECT id
            FROM tags
            WHERE workspace_id = $1 AND id = ANY($2::uuid[])
            FOR KEY SHARE
          `,
          [workspaceId, dto.tagIds],
        )) as Array<{ id: string }>;

        if (tagRows.length !== dto.tagIds.length) {
          throw new NotFoundException('Tag not found');
        }
      }

      await manager.query(
        `
          UPDATE feedback
          SET product_area_id = $3
          WHERE workspace_id = $1 AND id = $2
        `,
        [workspaceId, feedbackId, dto.productAreaId],
      );

      await manager.query(
        `
          DELETE FROM feedback_tags
          WHERE workspace_id = $1 AND feedback_id = $2
        `,
        [workspaceId, feedbackId],
      );

      if (dto.tagIds.length > 0) {
        await manager.query(
          `
            INSERT INTO feedback_tags (workspace_id, feedback_id, tag_id)
            SELECT $1, $2, tag_id
            FROM unnest($3::uuid[]) AS tag_id
          `,
          [workspaceId, feedbackId, dto.tagIds],
        );
      }

      return this.readClassification(manager, workspaceId, feedbackId);
    });
  }

  async create(
    workspaceId: string,
    userId: string,
    dto: CreateFeedbackDto,
  ): Promise<Feedback> {
    await this.requireMembership(workspaceId, userId, 'editor');

    return this.feedbackRepository.save({
      workspaceId,
      content: dto.content.trim(),
    });
  }
}
