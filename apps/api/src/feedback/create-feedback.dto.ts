import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, MaxLength } from 'class-validator';

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
}