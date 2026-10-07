import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FeedbackController } from './feedback.controller.js';
import { FeedbackService } from './feedback.service.js';
import { WorkspaceMembership } from '../workspaces/workspace-membership.entity.js';
import { Workspace } from '../workspaces/workspace.entity.js';
import { ProductArea } from './entity/product-area.entity.js';
import { Tag } from './entity/tag.entity.js';
import { ClassificationController } from './classification.controller.js';
import { Feedback } from './entity/feedback.entity.js';

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
