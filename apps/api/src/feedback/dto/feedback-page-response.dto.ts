import { ApiProperty } from '@nestjs/swagger';
import { FeedbackResponseDto } from './feedback-response.dto.js';

export class FeedbackPageResponseDto {
  @ApiProperty({ type: [FeedbackResponseDto] })
  items!: FeedbackResponseDto[];

  @ApiProperty({ type: String, nullable: true })
  nextCursor!: string | null;
}
