import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { BaseEntity } from './base.entity';

export type PriceDocument = Price & Document;

@Schema({
  timestamps: true,
  collection: 'prices',
})
export class Price extends BaseEntity {
  @ApiProperty({ description: 'Reference to the associated intention' })
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Intention', required: true })
  intention: MongooseSchema.Types.ObjectId;

  @ApiProperty({ description: 'Name of the pricing rule' })
  @Prop({ required: true })
  name: string;

  @ApiProperty({ description: 'Price amount' })
  @Prop({ required: true })
  amount: number;

  @ApiProperty({ description: 'Currency code (e.g., USD)' })
  @Prop({ required: true, default: 'USD' })
  currency: string;

  @ApiProperty({ description: 'Email quota for this price' })
  @Prop({ required: true, default: 100 })
  emailQuota: number;

  @ApiProperty({ description: 'Price per additional email beyond quota' })
  @Prop({ required: true, default: 0.1 })
  additionalEmailPrice: number;

  @ApiProperty({
    description: 'Criteria for applying this price',
    example: {
      minWordCount: 100,
      maxWordCount: 500,
      containsAttachments: true,
      priority: 'high',
    },
  })
  @Prop({
    type: MongooseSchema.Types.Mixed,
    default: {},
  })
  criteria: Record<string, any>;

  @ApiProperty({ description: 'Number of times this price was applied' })
  @Prop({ default: 0 })
  usageCount: number;
}

export const PriceSchema = SchemaFactory.createForClass(Price);
