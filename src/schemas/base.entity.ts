import { Prop, Schema } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';

@Schema()
export class BaseEntity {
  @ApiProperty({ description: 'Creation timestamp' })
  @Prop({ default: Date.now })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  @Prop({ default: Date.now })
  updatedAt: Date;

  @ApiProperty({ description: 'Whether the entity is active' })
  @Prop({ default: true })
  isActive: boolean;
}
