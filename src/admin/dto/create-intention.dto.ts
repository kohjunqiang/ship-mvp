import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsArray, IsObject, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateIntentionDto {
  @ApiProperty({ description: 'Name of the intention' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Description of the intention' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    description: 'Keywords that help identify this intention',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  keywords: string[];

  @ApiProperty({
    description: 'AI-specific configuration for intention detection',
    example: {
      threshold: 0.8,
      maxTokens: 1000,
      temperature: 0.7,
      prompt: 'Analyze if this email contains...',
    },
  })
  @IsObject()
  @IsOptional()
  aiConfig?: Record<string, any>;

  @ApiProperty({
    description: 'References to actions to be executed',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  actions: string[];
}
