import { Body, Controller, Get, Post } from '@nestjs/common';
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
@Controller('feedback')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Get()
  @ApiOkResponse({ type: FeedbackResponseDto, isArray: true })
  list() {
    return this.feedbackService.list();
  }

  @Post()
  @ApiCreatedResponse({ type: FeedbackResponseDto })
  @ApiBadRequestResponse({ type: ValidationErrorResponseDto })
  create(@Body() dto: CreateFeedbackDto) {
    return this.feedbackService.create(dto);
  }
}