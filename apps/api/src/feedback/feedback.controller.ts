import { Body, Controller, Get, Post } from '@nestjs/common';
import { CreateFeedbackDto } from './create-feedback.dto.js';
import { FeedbackService } from './feedback.service.js';

@Controller('feedback')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Get()
  list() {
    return this.feedbackService.list();
  }

  @Post()
  create(@Body() dto: CreateFeedbackDto) {
    return this.feedbackService.create(dto);
  }
}