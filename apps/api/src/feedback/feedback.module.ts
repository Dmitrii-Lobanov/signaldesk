import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Feedback } from './feedback.entity.js';
import { Workspace } from '../workspaces/workspace.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Feedback, Workspace])],
})
export class FeedbackModule {}