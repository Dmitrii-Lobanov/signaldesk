import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CreateFeedbackDto } from './create-feedback.dto.js';
import {
  FeedbackResponseDto,
  ValidationErrorResponseDto,
} from './feedback-response.dto.js';
import { FeedbackService } from './feedback.service.js';

@ApiTags('feedback')
@Controller('workspaces/:workspaceId/feedback')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Get()
  @ApiOkResponse({ type: FeedbackResponseDto, isArray: true })
  list(
    @Param('workspaceId', new ParseUUIDPipe()) workspaceId: string,
    @Session() session: UserSession,
  ) {
    return this.feedbackService.list(workspaceId, session.user.id);
  }

  @Get(':feedbackId')
  @ApiOkResponse({ type: FeedbackResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid UUID' })
  @ApiUnauthorizedResponse({ description: 'Sign-in required' })
  @ApiForbiddenResponse({ description: 'Workspace access denied' })
  @ApiNotFoundResponse({ description: 'Feedback not found' })
  detail(
    @Param('workspaceId', new ParseUUIDPipe()) workspaceId: string,
    @Param('feedbackId', new ParseUUIDPipe()) feedbackId: string,
    @Session() session: UserSession,
  ) {
    return this.feedbackService.detail(
      workspaceId,
      session.user.id,
      feedbackId,
    );
  }

  @Post()
  @ApiCreatedResponse({ type: FeedbackResponseDto })
  @ApiBadRequestResponse({ type: ValidationErrorResponseDto })
  create(
    @Param('workspaceId', new ParseUUIDPipe()) workspaceId: string,
    @Session() session: UserSession,
    @Body() dto: CreateFeedbackDto,
  ) {
    return this.feedbackService.create(workspaceId, session.user.id, dto);
  }
}
