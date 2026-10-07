import { ApiProperty } from '@nestjs/swagger';

export class FeedbackClassificationResponseDto {
  @ApiProperty({ format: 'uuid' })
  feedbackId!: string;

  @ApiProperty({ format: 'uuid', nullable: true })
  productAreaId!: string | null;

  @ApiProperty({ type: [String], format: 'uuid' })
  tagIds!: string[];
}
