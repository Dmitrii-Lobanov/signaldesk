import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
} from 'class-validator';

export class CreateFeedbackDto {
  @ApiProperty({
    description: 'Non-empty feedback text, up to 5000 characters',
    maxLength: 5000,
    example: 'Please add keyboard shortcuts.',
  })
  @IsString()
  @Matches(/\S/, { message: 'Feedback must not be empty' })
  @MaxLength(5000)
  content!: string;
  @ApiProperty({
    format: 'uuid',
    required: false,
    description: 'Reuse this key when retrying the same create request',
  })
  @IsOptional()
  @IsUUID('4')
  requestKey?: string;
}
