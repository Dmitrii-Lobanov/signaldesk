import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateWorkspaceMemberships1790102492466
  implements MigrationInterface
{
  name = 'CreateWorkspaceMemberships1790102492466';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "workspace_memberships" (
        "workspace_id" uuid NOT NULL,
        "user_id" text NOT NULL,
        "role" text NOT NULL,
        CONSTRAINT "pk_workspace_memberships"
          PRIMARY KEY ("workspace_id", "user_id"),
        CONSTRAINT "fk_membership_workspace"
          FOREIGN KEY ("workspace_id")
          REFERENCES "workspaces" ("id") ON DELETE CASCADE,
        CONSTRAINT "fk_membership_user"
          FOREIGN KEY ("user_id")
          REFERENCES "user" ("id") ON DELETE CASCADE,
        CONSTRAINT "ck_membership_role"
          CHECK ("role" IN ('editor', 'viewer'))
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_workspace_memberships_user_id"
      ON "workspace_memberships" ("user_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "workspace_memberships"`);
  }
}