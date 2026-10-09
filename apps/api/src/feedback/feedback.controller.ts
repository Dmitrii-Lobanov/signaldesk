import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CreateFeedbackDto } from './dto/create-feedback.dto.js';
import { FeedbackClassificationResponseDto } from './dto/feedback-classification-response.dto.js';
import { UpdateFeedbackClassificationDto } from './dto/update-feedback-classification.dto.js';
import {
  FeedbackResponseDto,
  ValidationErrorResponseDto,
} from './dto/feedback-response.dto.js';
import { FeedbackService } from './feedback.service.js';
import { FeedbackPageResponseDto } from './dto/feedback-page-response.dto.js';
import { ListFeedbackQueryDto } from './dto/list-feedback-query.dto.js';
import { AuditEventResponseDto } from './dto/audit-event-response.dto.js';
import { EditFeedbackDto } from './dto/edit-feedback.dto.js';

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

  @Get('page')
  @ApiOkResponse({ type: FeedbackPageResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid filter or cursor' })
  @ApiUnauthorizedResponse({ description: 'Sign-in required' })
  @ApiForbiddenResponse({ description: 'Workspace access denied' })
  page(
    @Param('workspaceId', new ParseUUIDPipe()) workspaceId: string,
    @Session() session: UserSession,
    @Query() query: ListFeedbackQueryDto,
  ) {
    return this.feedbackService.page(workspaceId, session.user.id, query);
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

  @Get(':feedbackId/classification')
  @ApiOkResponse({ type: FeedbackClassificationResponseDto })
  @ApiUnauthorizedResponse({ description: 'Sign-in required' })
  @ApiForbiddenResponse({ description: 'Workspace access denied' })
  @ApiNotFoundResponse({ description: 'Feedback not found' })
  getClassification(
    @Param('workspaceId', new ParseUUIDPipe()) workspaceId: string,
    @Param('feedbackId', new ParseUUIDPipe()) feedbackId: string,
    @Session() session: UserSession,
  ) {
    return this.feedbackService.getClassification(
      workspaceId,
      session.user.id,
      feedbackId,
    );
  }

  @Patch(':feedbackId/classification')
  @ApiOkResponse({ type: FeedbackClassificationResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid classification input' })
  @ApiUnauthorizedResponse({ description: 'Sign-in required' })
  @ApiForbiddenResponse({ description: 'Editor access required' })
  @ApiNotFoundResponse({ description: 'Feedback, area, or tag not found' })
  @ApiConflictResponse({ description: 'Feedback changed since it was loaded' })
  updateClassification(
    @Param('workspaceId', new ParseUUIDPipe()) workspaceId: string,
    @Param('feedbackId', new ParseUUIDPipe()) feedbackId: string,
    @Session() session: UserSession,
    @Body() dto: UpdateFeedbackClassificationDto,
  ) {
    return this.feedbackService.updateClassification(
      workspaceId,
      session.user.id,
      feedbackId,
      dto,
    );
  }

  @Get(':feedbackId/history')
  @ApiOkResponse({ type: AuditEventResponseDto, isArray: true })
  @ApiUnauthorizedResponse({ description: 'Sign-in required' })
  @ApiForbiddenResponse({ description: 'Workspace access denied' })
  @ApiNotFoundResponse({ description: 'Feedback not found' })
  history(
    @Param('workspaceId', new ParseUUIDPipe()) workspaceId: string,
    @Param('feedbackId', new ParseUUIDPipe()) feedbackId: string,
    @Session() session: UserSession,
  ) {
    return this.feedbackService.history(
      workspaceId,
      session.user.id,
      feedbackId,
    );
  }

  @Patch(':feedbackId')
  @ApiOkResponse({ type: FeedbackResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid feedback edit' })
  @ApiUnauthorizedResponse({ description: 'Sign-in required' })
  @ApiForbiddenResponse({ description: 'Editor access required' })
  @ApiNotFoundResponse({ description: 'Feedback not found' })
  @ApiConflictResponse({ description: 'Feedback changed since it was loaded' })
  edit(
    @Param('workspaceId', new ParseUUIDPipe()) workspaceId: string,
    @Param('feedbackId', new ParseUUIDPipe()) feedbackId: string,
    @Session() session: UserSession,
    @Body() dto: EditFeedbackDto,
  ) {
    return this.feedbackService.edit(
      workspaceId,
      session.user.id,
      feedbackId,
      dto,
    );
  }

  @Post()
  @ApiCreatedResponse({ type: FeedbackResponseDto })
  @ApiBadRequestResponse({ type: ValidationErrorResponseDto })
  @ApiConflictResponse({
    description: 'Request key was already used for different feedback',
  })
  create(
    @Param('workspaceId', new ParseUUIDPipe()) workspaceId: string,
    @Session() session: UserSession,
    @Body() dto: CreateFeedbackDto,
  ) {
    return this.feedbackService.create(workspaceId, session.user.id, dto);
  }
}
