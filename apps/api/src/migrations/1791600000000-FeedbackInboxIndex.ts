import { MigrationInterface, QueryRunner } from 'typeorm';

export class FeedbackInboxIndex1791600000000 implements MigrationInterface {
  name = 'FeedbackInboxIndex1791600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE INDEX "idx_feedback_workspace_created_id"
      ON "feedback" ("workspace_id", "created_at" DESC, "id" DESC)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX "idx_feedback_workspace_created_id"
    `);
  }
}