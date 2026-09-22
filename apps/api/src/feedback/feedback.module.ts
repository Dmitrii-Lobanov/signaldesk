import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Feedback } from './feedback.entity.js';
import { Workspace } from '../workspaces/workspace.entity.js';
import { FeedbackController } from './feedback.controller.js';
import { FeedbackService } from './feedback.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Feedback, Workspace])],
  controllers: [FeedbackController],
  providers: [FeedbackService],
})
export class FeedbackModule {}