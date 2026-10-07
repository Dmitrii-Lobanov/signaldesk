import { ApiProperty } from '@nestjs/swagger';

export class AuditEventResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  feedbackId!: string;

  @ApiProperty()
  actorUserId!: string;

  @ApiProperty({ nullable: true })
  actorEmail!: string | null;

  @ApiProperty({
    enum: ['feedback.created', 'feedback.edited', 'feedback.classified'],
  })
  action!: string;

  @ApiProperty({ nullable: true, type: 'object', additionalProperties: true })
  before!: Record<string, unknown> | null;

  @ApiProperty({ type: 'object', additionalProperties: true })
  after!: Record<string, unknown>;

  @ApiProperty({ format: 'date-time' })
  createdAt!: string;
}
