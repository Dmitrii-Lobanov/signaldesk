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
import { ClassificationSuggestionAdapter } from './classification-suggestion.adapter.js';
import { ClassificationSuggestionController } from './classification-suggestion.controller.js';

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
  controllers: [
    FeedbackController,
    ClassificationController,
    ClassificationSuggestionController,
  ],
  providers: [FeedbackService, ClassificationSuggestionAdapter],
})
export class FeedbackModule {}
