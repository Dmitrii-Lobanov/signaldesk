import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FeedbackController } from './feedback.controller.js';
import { Feedback } from './feedback.entity.js';
import { FeedbackService } from './feedback.service.js';
import { WorkspaceMembership } from '../workspaces/workspace-membership.entity.js';
import { Workspace } from '../workspaces/workspace.entity.js';
import { ProductArea } from './product-area.entity.js';
import { Tag } from './tag.entity.js';
import { ClassificationController } from './classification.controller.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Feedback,
      ProductArea,
      Tag,
      Workspace,
      WorkspaceMembership,
    ]),
  ],
  controllers: [FeedbackController, ClassificationController],
  providers: [FeedbackService],
})
export class FeedbackModule {}
