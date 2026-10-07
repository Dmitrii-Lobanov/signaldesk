import { ApiProperty } from '@nestjs/swagger';

export class ClassificationOptionResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  workspaceId!: string;

  @ApiProperty({ example: 'Navigation' })
  name!: string;
}
