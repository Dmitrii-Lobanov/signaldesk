import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkspaceMembership } from '../workspaces/workspace-membership.entity.js';
import { CreateFeedbackDto } from './create-feedback.dto.js';
import { Feedback } from './feedback.entity.js';

@Injectable()
export class FeedbackService {
  constructor(
    @InjectRepository(Feedback)
    private readonly feedbackRepository: Repository<Feedback>,
    @InjectRepository(WorkspaceMembership)
    private readonly membershipRepository: Repository<WorkspaceMembership>,
  ) {}

  private async requireMembership(
    workspaceId: string,
    userId: string,
    requiredRole: 'editor' | 'viewer',
  ): Promise<void> {
    const membership = await this.membershipRepository.findOneBy({
      workspaceId,
      userId,
    });

    if (
      !membership ||
      (requiredRole === 'editor' && membership.role !== 'editor')
    ) {
      throw new ForbiddenException('Workspace access denied');
    }
  }

  async list(workspaceId: string, userId: string): Promise<Feedback[]> {
    await this.requireMembership(workspaceId, userId, 'viewer');

    return this.feedbackRepository.find({
      where: { workspaceId },
      order: { createdAt: 'DESC', id: 'DESC' },
      take: 50,
    });
  }

  async detail(
    workspaceId: string,
    userId: string,
    feedbackId: string,
  ): Promise<Feedback> {
    await this.requireMembership(workspaceId, userId, 'viewer');

    const feedback = await this.feedbackRepository.findOneBy({
      id: feedbackId,
      workspaceId,
    });

    if (!feedback) {
      throw new NotFoundException('Feedback not found');
    }

    return feedback;
  }

  async create(
    workspaceId: string,
    userId: string,
    dto: CreateFeedbackDto,
  ): Promise<Feedback> {
    await this.requireMembership(workspaceId, userId, 'editor');

    return this.feedbackRepository.save({
      workspaceId,
      content: dto.content.trim(),
    });
  }
}
