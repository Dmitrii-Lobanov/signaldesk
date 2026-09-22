import { IsString, Matches, MaxLength } from 'class-validator';

export class CreateFeedbackDto {
  @IsString()
  @Matches(/\S/, { message: 'Feedback must not be empty' })
  @MaxLength(5000)
  content!: string;
}