import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { BaseEntity } from './base.entity';
import * as mongoose from 'mongoose';

export enum ProcessingStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  PROCESSED = 'PROCESSED',
  NO_MATCH = 'NO_MATCH',
  ERROR = 'ERROR',
  IGNORED = 'IGNORED',
}

export type ProcessedEmailDocument = ProcessedEmail & Document;

@Schema({
  timestamps: true,
  collection: 'processed_emails',
})
export class ProcessedEmail extends BaseEntity {
  @ApiProperty({ description: 'Reference to the user who owns this email' })
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  user: any;

  @ApiProperty({ description: 'Unique email ID from the email server' })
  @Prop({ required: true })
  emailId: string;

  @ApiProperty({ description: 'Email subject' })
  @Prop({ required: true })
  subject: string;

  @ApiProperty({ description: 'Email sender address' })
  @Prop({ required: true })
  sender: string;

  @ApiProperty({ description: 'Email content' })
  @Prop({ required: true })
  content: string;

  @ApiProperty({ description: 'Reference to the detected intention' })
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Intention' })
  detectedIntention?: MongooseSchema.Types.ObjectId;

  @ApiProperty({ description: 'Reference to the applied price' })
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Price' })
  appliedPrice?: MongooseSchema.Types.ObjectId;

  @ApiProperty({ description: 'References to executed actions' })
  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'Action' }] })
  executedActions: MongooseSchema.Types.ObjectId[];

  @ApiProperty({ description: 'Whether the email has been processed' })
  @Prop({ default: false })
  isProcessed: boolean;

  @ApiProperty({ description: 'When the email was processed' })
  @Prop()
  processedAt?: Date;

  @ApiProperty({
    description: 'Data extracted from the email content',
    example: {
      date: '2025-04-19',
      amount: 1000,
      category: 'invoice',
    },
  })
  @Prop({ type: MongooseSchema.Types.Mixed, default: {} })
  extractedData: Record<string, any>;

  @ApiProperty({
    description: 'Response from the AI provider',
    example: {
      confidence: 0.95,
      model: 'gemini-pro',
      tokens: 150,
    },
  })
  @Prop({ type: MongooseSchema.Types.Mixed, default: {} })
  aiResponse: Record<string, any>;

  @ApiProperty({
    description: 'Current status of the email processing',
    enum: ProcessingStatus,
  })
  @Prop({ required: true, enum: ProcessingStatus, default: ProcessingStatus.PENDING })
  status: ProcessingStatus;

  @ApiProperty({ description: 'Error message if processing failed' })
  @Prop()
  error?: string;

  @ApiProperty({ description: 'Processing duration in milliseconds' })
  @Prop({ default: 0 })
  processingDuration: number;

  @ApiProperty({ description: 'Number of processing attempts' })
  @Prop({ default: 0 })
  attempts: number;
}

export const ProcessedEmailSchema = SchemaFactory.createForClass(ProcessedEmail);
