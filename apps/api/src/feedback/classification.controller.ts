import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import {
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ClassificationOptionResponseDto } from './dto/classification-option-response.dto.js';
import { FeedbackService } from './feedback.service.js';

@ApiTags('classification')
@Controller('workspaces/:workspaceId')
export class ClassificationController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Get('product-areas')
  @ApiOkResponse({ type: ClassificationOptionResponseDto, isArray: true })
  @ApiUnauthorizedResponse({ description: 'Sign-in required' })
  @ApiForbiddenResponse({ description: 'Workspace access denied' })
  listProductAreas(
    @Param('workspaceId', new ParseUUIDPipe()) workspaceId: string,
    @Session() session: UserSession,
  ) {
    return this.feedbackService.listProductAreas(workspaceId, session.user.id);
  }

  @Get('tags')
  @ApiOkResponse({ type: ClassificationOptionResponseDto, isArray: true })
  @ApiUnauthorizedResponse({ description: 'Sign-in required' })
  @ApiForbiddenResponse({ description: 'Workspace access denied' })
  listTags(
    @Param('workspaceId', new ParseUUIDPipe()) workspaceId: string,
    @Session() session: UserSession,
  ) {
    return this.feedbackService.listTags(workspaceId, session.user.id);
  }
}
