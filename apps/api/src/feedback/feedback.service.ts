import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Feedback } from './feedback.entity.js';
import { CreateFeedbackDto } from './create-feedback.dto.js';

const DEMO_WORKSPACE_ID = '11111111-1111-4111-8111-111111111111';

@Injectable()
export class FeedbackService {
  constructor(
    @InjectRepository(Feedback)
    private readonly feedbackRepository: Repository<Feedback>,
  ) {}

  list(): Promise<Feedback[]> {
    return this.feedbackRepository.find({
      where: { workspaceId: DEMO_WORKSPACE_ID },
      order: { createdAt: 'DESC', id: 'DESC' },
      take: 50,
    });
  }

  create(dto: CreateFeedbackDto): Promise<Feedback> {
    return this.feedbackRepository.save({
      workspaceId: DEMO_WORKSPACE_ID,
      content: dto.content.trim(),
    });
  }
}