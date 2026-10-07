import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Workspace } from '../../workspaces/workspace.entity.js';

@Entity({ name: 'feedback' })
export class Feedback {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'workspace_id', type: 'uuid' })
  workspaceId!: string;

  @ManyToOne(() => Workspace, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({
    name: 'workspace_id',
    foreignKeyConstraintName: 'fk_feedback_workspace',
  })
  workspace!: Workspace;

  @Column({ type: 'varchar', length: 50, default: 'manual' })
  source!: string;

  @Column({ type: 'text' })
  content!: string;
  @Column({ type: 'integer', default: 1 })
  version!: number;
  @Column({
    name: 'create_request_key',
    type: 'uuid',
    nullable: true,
    select: false,
  })
  createRequestKey!: string | null;

  @Column({
    name: 'create_request_user_id',
    type: 'text',
    nullable: true,
    select: false,
  })
  createRequestUserId!: string | null;

  @Column({
    name: 'occurred_at',
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
  })
  occurredAt!: Date;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamptz',
  })
  createdAt!: Date;
}
