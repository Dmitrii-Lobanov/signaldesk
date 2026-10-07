import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, Matches, MaxLength, Min } from 'class-validator';

export class EditFeedbackDto {
  @ApiProperty({ example: 'Updated customer feedback', maxLength: 5000 })
  @IsString()
  @Matches(/\S/, { message: 'Feedback must not be empty' })
  @MaxLength(5000)
  content!: string;

  @ApiProperty({ example: 1, minimum: 1 })
  @IsInt()
  @Min(1)
  expectedVersion!: number;
}
