import { Column, Entity, PrimaryColumn } from 'typeorm';

export type WorkspaceRole = 'editor' | 'viewer';

@Entity({ name: 'workspace_memberships' })
export class WorkspaceMembership {
  @PrimaryColumn({ name: 'workspace_id', type: 'uuid' })
  workspaceId!: string;

  @PrimaryColumn({ name: 'user_id', type: 'text' })
  userId!: string;

  @Column({ type: 'text' })
  role!: WorkspaceRole;
}