import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Document } from 'mongoose';
import { BaseEntity } from './base.entity';

export type UserDocument = User & Document;

@Schema({
  timestamps: true,
  collection: 'users',
})
export class User extends BaseEntity {
  @ApiProperty({ description: 'User email address' })
  @Prop({ required: true, unique: true })
  email: string;

  @ApiProperty({ description: 'Encrypted email account password' })
  @Prop({ required: true })
  emailPassword: string;

  @ApiProperty({ description: 'Email provider settings' })
  @Prop({
    type: {
      host: { type: String, required: true },
      port: { type: Number, required: true },
      secure: { type: Boolean, required: true },
    },
    required: true,
  })
  emailSettings: {
    host: string;
    port: number;
    secure: boolean;
  };

  @ApiProperty({ description: 'Number of emails processed' })
  @Prop({ default: 0 })
  emailsProcessed: number;

  @ApiProperty({ description: 'Number of matched intentions' })
  @Prop({ default: 0 })
  matchedIntentions: number;

  @ApiProperty({ description: 'Last email processing timestamp' })
  @Prop()
  lastProcessedAt?: Date;

  @ApiProperty({ description: 'Last error message if any' })
  @Prop()
  lastError?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
