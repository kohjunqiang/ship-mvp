import { Schema, Types } from 'mongoose';
import { User } from '../../src/schemas/user.entity';
import { Intention, IntentionDocument } from '../../src/schemas/intention.entity';
import { ProcessingStatus } from '../../src/schemas/processed-email.entity';
import { ActionType } from '../../src/schemas/action.entity';
import mongoose from 'mongoose';

// Temporary type alias to get past the type issues
type ObjectId = any;

export interface MockUser {
  _id: ObjectId;
  email: string;
  emailPassword: string;
  emailSettings: {
    host: string;
    port: number;
    secure: boolean;
  };
  emailsProcessed: number;
  matchedIntentions: number;
  lastProcessedAt?: Date;
  lastError?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MockProcessedEmail {
  _id: ObjectId;
  user: ObjectId;
  subject: string;
  content: string;
  status: ProcessingStatus;
  matchedIntention?: ObjectId;
  extractedData?: Record<string, any>;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MockIntention extends Omit<Intention, '_id'> {
  _id: ObjectId;
  actions: ObjectId[];
}

export interface MockAction {
  _id: ObjectId;
  name: string;
  description: string;
  type: ActionType;
  config: Record<string, any>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const createMockObjectId = (id?: string): ObjectId => {
  return id ? 
    new Types.ObjectId(id) : 
    new Types.ObjectId('507f1f77bcf86cd799439011');
};

export const asMongoObjectId = (id: any): ObjectId => {
  if (typeof id === 'string') {
    return new Types.ObjectId(id);
  }
  if (id && typeof id.toString === 'function') {
    return new Types.ObjectId(id.toString());
  }
  return new Types.ObjectId();
};

export const asMongooseObjectId = (id: any): ObjectId => {
  return new Types.ObjectId(id.toString());
};

export const createMockUser = (overrides: Partial<MockUser> = {}): MockUser => ({
  _id: createMockObjectId(),
  email: 'test@example.com',
  emailPassword: 'hashedPassword123',
  emailSettings: {
    host: 'imap.gmail.com',
    port: 993,
    secure: true,
  },
  emailsProcessed: 0,
  matchedIntentions: 0,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createMockProcessedEmail = (overrides: Partial<MockProcessedEmail> = {}): MockProcessedEmail => ({
  _id: createMockObjectId(),
  user: createMockObjectId(),
  subject: 'Test Subject',
  content: 'Test Content',
  status: ProcessingStatus.PENDING,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createMockIntention = (overrides: Partial<MockIntention> = {}): IntentionDocument => {
  const mockIntention: MockIntention = {
    _id: createMockObjectId(),
    name: 'Test Intention',
    description: 'Test Description',
    keywords: ['test', 'keyword'],
    aiConfig: {
      threshold: 0.8,
      extractFields: ['field1', 'field2'],
      prompt: 'Test prompt',
    },
    actions: [createMockObjectId()],
    matchCount: 0,
    averageConfidence: 0,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };

  return mockIntention as unknown as IntentionDocument;
};

export const createMockAction = (overrides: Partial<MockAction> = {}): MockAction => ({
  _id: createMockObjectId(),
  name: 'Test Action',
  description: 'Test Description',
  type: ActionType.API_CALL,
  config: {
    url: 'https://api.example.com/action',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    bodyTemplate: {},
  },
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});
