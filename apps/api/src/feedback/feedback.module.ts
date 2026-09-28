import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FeedbackController } from './feedback.controller.js';
import { Feedback } from './feedback.entity.js';
import { FeedbackService } from './feedback.service.js';
import { WorkspaceMembership } from '../workspaces/workspace-membership.entity.js';
import { Workspace } from '../workspaces/workspace.entity.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Feedback, Workspace, WorkspaceMembership]),
  ],
  controllers: [FeedbackController],
  providers: [FeedbackService],
})
export class FeedbackModule {}