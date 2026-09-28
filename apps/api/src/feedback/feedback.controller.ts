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
  ApiOkResponse,
  ApiTags,
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
