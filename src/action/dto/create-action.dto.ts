import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEnum, IsObject, ValidateNested, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { ActionType } from '../../schemas/action.entity';

export class SendEmailConfig {
  @ApiProperty({ description: 'Email template ID or name' })
  @IsString()
  template: string;

  @ApiProperty({ description: 'Recipient email address template' })
  @IsString()
  to: string;

  @ApiProperty({ description: 'Email subject template', required: false })
  @IsString()
  subject?: string;

  @ApiProperty({ description: 'Email body template', required: false })
  @IsString()
  body?: string;
}

export class ApiCallConfig {
  @ApiProperty({ description: 'API endpoint URL template' })
  @IsString()
  url: string;

  @ApiProperty({ description: 'HTTP method' })
  @IsString()
  method: string;

  @ApiProperty({ description: 'Request headers', required: false })
  @IsObject()
  headers?: Record<string, string>;

  @ApiProperty({ description: 'Request body template', required: false })
  @IsObject()
  body?: Record<string, any>;
}

export class UpdateRecordConfig {
  @ApiProperty({ description: 'Collection or table name' })
  @IsString()
  collection: string;

  @ApiProperty({ description: 'Record ID or query template' })
  @IsString()
  identifier: string;

  @ApiProperty({ description: 'Update data template' })
  @IsObject()
  data: Record<string, any>;
}

export class NotificationConfig {
  @ApiProperty({ description: 'Notification title template' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Notification message template' })
  @IsString()
  message: string;

  @ApiProperty({ description: 'Notification type or channel' })
  @IsString()
  type: string;

  @ApiProperty({ description: 'Recipients', required: false })
  @IsString({ each: true })
  recipients?: string[];
}

export class CreateActionDto {
  @ApiProperty({ description: 'Name of the action' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Description of what the action does' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ enum: ActionType, description: 'Type of action' })
  @IsEnum(ActionType)
  type: ActionType;

  @ApiProperty({ description: 'Order of execution' })
  @IsNumber()
  order: number;

  @ApiProperty({
    description: 'Configuration specific to the action type',
    type: 'object',
  })
  @IsObject()
  @ValidateNested()
  @Type((options) => {
    const { object } = options;
    switch (object?.type) {
      case ActionType.SEND_EMAIL:
        return SendEmailConfig;
      case ActionType.API_CALL:
        return ApiCallConfig;
      case ActionType.UPDATE_RECORD:
        return UpdateRecordConfig;
      case ActionType.NOTIFICATION:
        return NotificationConfig;
      default:
        return Object;
    }
  })
  config: SendEmailConfig | ApiCallConfig | UpdateRecordConfig | NotificationConfig | Record<string, any>;
}
