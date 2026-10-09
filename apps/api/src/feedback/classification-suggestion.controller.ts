import {
  Controller,
  HttpException,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { ClassificationSuggestionAdapter } from './classification-suggestion.adapter.js';
import { FeedbackService } from './feedback.service.js';

@Controller('workspaces/:workspaceId/feedback')
export class ClassificationSuggestionController {
  private readonly requests = new Map<
    string,
    { startedAt: number; count: number; inFlight: boolean }
  >();

  constructor(
    private readonly feedbackService: FeedbackService,
    private readonly adapter: ClassificationSuggestionAdapter,
  ) {}

  @Post(':feedbackId/classification-suggestion')
  async suggest(
    @Param('workspaceId', new ParseUUIDPipe()) workspaceId: string,
    @Param('feedbackId', new ParseUUIDPipe()) feedbackId: string,
    @Session() session: UserSession,
  ) {
    await this.feedbackService.requireEditor(workspaceId, session.user.id);

    const key = `${workspaceId}:${session.user.id}`;
    const now = Date.now();

    if (this.requests.size > 5000) {
      for (const [candidate, limit] of this.requests) {
        if (!limit.inFlight && now - limit.startedAt >= 60 * 60 * 1000) {
          this.requests.delete(candidate);
        }
      }
    }

    const previous = this.requests.get(key);
    const limit =
      previous && now - previous.startedAt < 60 * 60 * 1000
        ? previous
        : { startedAt: now, count: 0, inFlight: false };

    if (limit.inFlight || limit.count >= 5 || this.requests.size > 5000) {
      throw new HttpException(
        'Suggestion limit reached. Classify manually or try later.',
        429,
      );
    }

    limit.count += 1;
    limit.inFlight = true;
    this.requests.set(key, limit);

    try {
      const [feedback, areas, tags] = await Promise.all([
        this.feedbackService.detail(workspaceId, session.user.id, feedbackId),
        this.feedbackService.listProductAreas(workspaceId, session.user.id),
        this.feedbackService.listTags(workspaceId, session.user.id),
      ]);

      if (areas.length > 40 || tags.length > 40) {
        throw new HttpException(
          'Too many classification choices. Classify manually.',
          503,
        );
      }

      return await this.adapter.suggest(
        feedback.content,
        feedback.version,
        areas,
        tags,
      );
    } finally {
      limit.inFlight = false;
    }
  }
}
