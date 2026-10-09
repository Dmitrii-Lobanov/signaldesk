import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsInt,
  IsUUID,
  Min,
  ValidateIf,
} from 'class-validator';

export class UpdateFeedbackClassificationDto {
  @ApiProperty({ type: String, format: 'uuid', nullable: true })
  @ValidateIf((_object, value: unknown) => value !== null)
  @IsUUID('4')
  productAreaId!: string | null;

  @ApiProperty({ type: [String], format: 'uuid', maxItems: 20 })
  @IsArray()
  @ArrayMaxSize(20)
  @ArrayUnique()
  @IsUUID('4', { each: true })
  tagIds!: string[];

  @ApiProperty({ example: 1, minimum: 1 })
  @IsInt()
  @Min(1)
  expectedVersion!: number;
}
