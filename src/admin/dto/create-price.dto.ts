import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, IsObject, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePriceDto {
  @ApiProperty({ description: 'Reference to the associated intention' })
  @IsString()
  @IsNotEmpty()
  intention: string;

  @ApiProperty({ description: 'Name of the pricing rule' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Price amount' })
  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @ApiProperty({ description: 'Currency code (e.g., USD)' })
  @IsString()
  @IsNotEmpty()
  currency: string;

  @ApiProperty({
    description: 'Criteria for applying this price',
    example: {
      minWordCount: 100,
      maxWordCount: 500,
      containsAttachments: true,
      priority: 'high',
    },
  })
  @IsObject()
  @IsOptional()
  criteria?: Record<string, any>;
}
