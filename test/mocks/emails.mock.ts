import { ProcessedEmail, ProcessingStatus } from '../../src/schemas/processed-email.entity';
import { Schema } from 'mongoose';
import { createMockObjectId } from '../utils/test.utils';

export function createMockEmail(): ProcessedEmail & { _id: Schema.Types.ObjectId } {
  return {
    _id: createMockObjectId(),
    user: createMockObjectId(),
    subject: 'Test Email',
    content: 'This is a test email content',
    sender: 'test@example.com',
    emailId: 'test-123',
    status: ProcessingStatus.PENDING,
    isProcessed: false,
    extractedData: {},
    aiResponse: {},
    executedActions: [],
    processingDuration: 0,
    attempts: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    isActive: true,
  };
}

export const mockEmails = [
  {
    _id: createMockObjectId(),
    user: createMockObjectId(),
    subject: 'Meeting Request',
    content: 'Can we schedule a meeting for tomorrow at 2 PM?',
    sender: 'john@example.com',
    emailId: 'email-1',
    status: ProcessingStatus.PROCESSED,
    isProcessed: true,
    extractedData: {
      date: '2025-04-20',
      time: '14:00',
      type: 'meeting',
    },
    aiResponse: {
      confidence: 0.95,
      model: 'gemini-pro',
      tokens: 150,
    },
    executedActions: [createMockObjectId()],
    processingDuration: 1500,
    attempts: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    isActive: true,
  },
  {
    _id: createMockObjectId(),
    user: createMockObjectId(),
    subject: 'Invoice #123',
    content: 'Please find attached invoice #123 for $500',
    sender: 'billing@example.com',
    emailId: 'email-2',
    status: ProcessingStatus.ERROR,
    isProcessed: false,
    extractedData: {},
    aiResponse: {},
    executedActions: [],
    processingDuration: 0,
    attempts: 3,
    error: 'Failed to process email',
    createdAt: new Date(),
    updatedAt: new Date(),
    isActive: true,
  },
];

export const mockProcessedEmailService = {
  findProcessedEmails: jest.fn().mockResolvedValue(mockEmails),
  findProcessedEmailsByUser: jest.fn().mockImplementation((userId) =>
    Promise.resolve(mockEmails.filter(email => email.user?.toString() === userId))
  ),
  markEmailAsProcessed: jest.fn().mockImplementation((id, status, data) =>
    Promise.resolve({
      ...mockEmails.find(email => email._id?.toString() === id.toString()),
      status,
      processedAt: new Date(),
      ...data,
    })
  ),
  findProcessedEmailById: jest.fn().mockImplementation((id) =>
    Promise.resolve(mockEmails.find(email => email._id?.toString() === id.toString()))
  ),
};
