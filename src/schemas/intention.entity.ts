import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { BaseEntity } from './base.entity';

export type IntentionDocument = Intention & Document;

@Schema({
  timestamps: true,
  collection: 'intentions',
})
export class Intention extends BaseEntity {
  @ApiProperty({ description: 'Name of the intention' })
  @Prop({ required: true })
  name: string;

  @ApiProperty({ description: 'Description of the intention' })
  @Prop({ required: true })
  description: string;

  @ApiProperty({ description: 'Keywords that help identify this intention' })
  @Prop({ type: [String], default: [] })
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
  @Prop({
    type: MongooseSchema.Types.Mixed,
    default: {
      threshold: 0.8,
      maxTokens: 1000,
      temperature: 0.7,
    },
  })
  aiConfig: Record<string, any>;

  @ApiProperty({ description: 'References to actions to be executed' })
  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'Action' }] })
  actions: MongooseSchema.Types.ObjectId[];

  @ApiProperty({ description: 'Number of times this intention was matched' })
  @Prop({ default: 0 })
  matchCount: number;

  @ApiProperty({ description: 'Average confidence score of matches' })
  @Prop({ default: 0 })
  averageConfidence: number;
}

export const IntentionSchema = SchemaFactory.createForClass(Intention);
