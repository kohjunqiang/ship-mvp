import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { BaseEntity } from './base.entity';

export enum ActionType {
  SEND_EMAIL = 'send_email',
  API_CALL = 'api_call',
  UPDATE_RECORD = 'update_record',
  NOTIFICATION = 'notification',
  CUSTOM = 'custom',
}

export type ActionDocument = Action & Document;

@Schema({
  timestamps: true,
  collection: 'actions',
})
export class Action extends BaseEntity {
  @ApiProperty({ description: 'Name of the action' })
  @Prop({ required: true })
  name: string;

  @ApiProperty({
    description: 'Type of action',
    enum: ActionType,
  })
  @Prop({ required: true, enum: ActionType })
  type: ActionType;

  @ApiProperty({
    description: 'Configuration for the action',
    example: {
      emailTemplate: 'template1',
      apiEndpoint: 'https://api.example.com',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
  })
  @Prop({
    type: MongooseSchema.Types.Mixed,
    required: true,
  })
  config: Record<string, any>;

  @ApiProperty({
    description: 'Order in which this action should be executed',
  })
  @Prop({ required: true, default: 0 })
  order: number;

  @ApiProperty({ description: 'Success count of this action' })
  @Prop({ default: 0 })
  successCount: number;

  @ApiProperty({ description: 'Failure count of this action' })
  @Prop({ default: 0 })
  failureCount: number;

  @ApiProperty({ description: 'Average execution time in milliseconds' })
  @Prop({ default: 0 })
  averageExecutionTime: number;

  @ApiProperty({ description: 'Last error message if any' })
  @Prop()
  lastError?: string;
}

export const ActionSchema = SchemaFactory.createForClass(Action);
