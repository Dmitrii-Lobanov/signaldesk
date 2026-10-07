import { MigrationInterface, QueryRunner } from 'typeorm';

export class ReliableFeedbackChanges1791500000000
  implements MigrationInterface
{
  name = 'ReliableFeedbackChanges1791500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "feedback"
      ADD COLUMN "version" integer NOT NULL DEFAULT 1,
      ADD COLUMN "create_request_key" uuid,
      ADD COLUMN "create_request_user_id" text,
      ADD CONSTRAINT "ck_feedback_create_request_pair"
        CHECK (
          ("create_request_key" IS NULL AND "create_request_user_id" IS NULL)
          OR
          ("create_request_key" IS NOT NULL AND "create_request_user_id" IS NOT NULL)
        ),
      ADD CONSTRAINT "ck_feedback_version_positive" CHECK ("version" > 0)
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "uq_feedback_create_request"
      ON "feedback" ("workspace_id", "create_request_user_id", "create_request_key")
      WHERE "create_request_key" IS NOT NULL
    `);

    await queryRunner.query(`
      CREATE TABLE "audit_events" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "workspace_id" uuid NOT NULL,
        "feedback_id" uuid NOT NULL,
        "actor_user_id" text NOT NULL,
        "action" varchar(50) NOT NULL,
        "before" jsonb,
        "after" jsonb NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "pk_audit_events" PRIMARY KEY ("id"),
        CONSTRAINT "fk_audit_events_workspace"
          FOREIGN KEY ("workspace_id")
          REFERENCES "workspaces" ("id") ON DELETE RESTRICT,
        CONSTRAINT "ck_audit_events_action"
          CHECK ("action" IN ('feedback.created', 'feedback.edited', 'feedback.classified'))
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_audit_events_feedback_history"
      ON "audit_events" ("workspace_id", "feedback_id", "created_at" DESC, "id" DESC)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE "audit_events"');
    await queryRunner.query('DROP INDEX "uq_feedback_create_request"');
    await queryRunner.query(`
      ALTER TABLE "feedback"
      DROP CONSTRAINT "ck_feedback_version_positive",
      DROP CONSTRAINT "ck_feedback_create_request_pair",
      DROP COLUMN "create_request_user_id",
      DROP COLUMN "create_request_key",
      DROP COLUMN "version"
    `);
  }
}