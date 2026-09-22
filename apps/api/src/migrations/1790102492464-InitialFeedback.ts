import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialFeedback1790102492464 implements MigrationInterface {
    name = 'InitialFeedback1790102492464'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "workspaces" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying(100) NOT NULL,
                CONSTRAINT "PK_098656ae401f3e1a4586f47fd8e" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "feedback" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "workspace_id" uuid NOT NULL,
                "source" character varying(50) NOT NULL DEFAULT 'manual',
                "content" text NOT NULL,
                "occurred_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_8389f9e087a57689cd5be8b2b13" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            ALTER TABLE "feedback"
            ADD CONSTRAINT "fk_feedback_workspace" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "feedback" DROP CONSTRAINT "fk_feedback_workspace"
        `);
        await queryRunner.query(`
            DROP TABLE "feedback"
        `);
        await queryRunner.query(`
            DROP TABLE "workspaces"
        `);
    }

}
