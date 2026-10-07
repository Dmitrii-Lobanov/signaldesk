import { MigrationInterface, QueryRunner } from 'typeorm';

export class FeedbackClassification1791400000000
  implements MigrationInterface
{
  name = 'FeedbackClassification1791400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "product_areas" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "workspace_id" uuid NOT NULL,
        "name" varchar(100) NOT NULL,
        CONSTRAINT "pk_product_areas" PRIMARY KEY ("id"),
        CONSTRAINT "uq_product_areas_workspace_id"
          UNIQUE ("workspace_id", "id"),
        CONSTRAINT "uq_product_areas_workspace_name"
          UNIQUE ("workspace_id", "name"),
        CONSTRAINT "fk_product_areas_workspace"
          FOREIGN KEY ("workspace_id")
          REFERENCES "workspaces" ("id") ON DELETE RESTRICT
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "tags" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "workspace_id" uuid NOT NULL,
        "name" varchar(100) NOT NULL,
        CONSTRAINT "pk_tags" PRIMARY KEY ("id"),
        CONSTRAINT "uq_tags_workspace_id"
          UNIQUE ("workspace_id", "id"),
        CONSTRAINT "uq_tags_workspace_name"
          UNIQUE ("workspace_id", "name"),
        CONSTRAINT "fk_tags_workspace"
          FOREIGN KEY ("workspace_id")
          REFERENCES "workspaces" ("id") ON DELETE RESTRICT
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "feedback"
      ADD CONSTRAINT "uq_feedback_workspace_id"
      UNIQUE ("workspace_id", "id")
    `);

    await queryRunner.query(`
      ALTER TABLE "feedback"
      ADD COLUMN "product_area_id" uuid
    `);

    await queryRunner.query(`
      ALTER TABLE "feedback"
      ADD CONSTRAINT "fk_feedback_product_area_workspace"
      FOREIGN KEY ("workspace_id", "product_area_id")
      REFERENCES "product_areas" ("workspace_id", "id")
      ON DELETE RESTRICT
    `);

    await queryRunner.query(`
      CREATE TABLE "feedback_tags" (
        "workspace_id" uuid NOT NULL,
        "feedback_id" uuid NOT NULL,
        "tag_id" uuid NOT NULL,
        CONSTRAINT "pk_feedback_tags"
          PRIMARY KEY ("workspace_id", "feedback_id", "tag_id"),
        CONSTRAINT "fk_feedback_tags_feedback_workspace"
          FOREIGN KEY ("workspace_id", "feedback_id")
          REFERENCES "feedback" ("workspace_id", "id")
          ON DELETE CASCADE,
        CONSTRAINT "fk_feedback_tags_tag_workspace"
          FOREIGN KEY ("workspace_id", "tag_id")
          REFERENCES "tags" ("workspace_id", "id")
          ON DELETE RESTRICT
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_feedback_tags_workspace_tag"
      ON "feedback_tags" ("workspace_id", "tag_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE "feedback_tags"');

    await queryRunner.query(`
      ALTER TABLE "feedback"
      DROP CONSTRAINT "fk_feedback_product_area_workspace"
    `);

    await queryRunner.query(`
      ALTER TABLE "feedback"
      DROP COLUMN "product_area_id"
    `);

    await queryRunner.query(`
      ALTER TABLE "feedback"
      DROP CONSTRAINT "uq_feedback_workspace_id"
    `);

    await queryRunner.query('DROP TABLE "tags"');
    await queryRunner.query('DROP TABLE "product_areas"');
  }
}