import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Workspace } from '../workspaces/workspace.entity.js';

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