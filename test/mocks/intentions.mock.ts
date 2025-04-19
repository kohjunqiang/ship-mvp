import { createMockObjectId } from '../utils/test.utils';

export const mockMeetingIntention = {
  _id: createMockObjectId(),
  name: 'Schedule Meeting',
  description: 'Schedule meetings from email requests',
  keywords: ['meeting', 'schedule', 'appointment'],
  aiConfig: {
    threshold: 0.8,
    extractFields: ['date', 'time', 'attendees'],
    prompt: 'Extract meeting details from the email',
  },
  actions: [createMockObjectId()],
  matchCount: 10,
  averageConfidence: 0.85,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const mockOrderIntention = {
  _id: createMockObjectId(),
  name: 'Process Order',
  description: 'Process order confirmations and updates',
  keywords: ['order', 'purchase', 'confirmation'],
  aiConfig: {
    threshold: 0.85,
    extractFields: ['orderId', 'amount', 'status'],
    prompt: 'Extract order details from the email',
  },
  actions: [createMockObjectId()],
  matchCount: 15,
  averageConfidence: 0.9,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const mockTaskIntention = {
  _id: createMockObjectId(),
  name: 'Create Task',
  description: 'Create tasks from email requests',
  keywords: ['task', 'todo', 'review'],
  aiConfig: {
    threshold: 0.75,
    extractFields: ['title', 'priority', 'deadline'],
    prompt: 'Extract task details from the email',
  },
  actions: [createMockObjectId()],
  matchCount: 5,
  averageConfidence: 0.8,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const mockIntentions = [
  mockMeetingIntention,
  mockOrderIntention,
  mockTaskIntention,
];

export const mockIntentionService = {
  findOne: jest.fn().mockImplementation((_id: any) =>
    Promise.resolve(mockIntentions.find(intention => intention._id === _id))
  ),
  findAll: jest.fn().mockResolvedValue(mockIntentions),
  create: jest.fn().mockImplementation((dto) =>
    Promise.resolve({ ...dto, _id: createMockObjectId(), createdAt: new Date(), updatedAt: new Date() })
  ),
  update: jest.fn().mockImplementation((_id, dto) =>
    Promise.resolve({ ...mockIntentions.find(intention => intention._id === _id), ...dto, updatedAt: new Date() })
  ),
  remove: jest.fn().mockImplementation((_id: any) =>
    Promise.resolve(mockIntentions.find(intention => intention._id === _id))
  ),
  updateStatistics: jest.fn().mockImplementation((_id, confidence) =>
    Promise.resolve({ ...mockIntentions.find(intention => intention._id === _id), matchCount: 1, averageConfidence: confidence, updatedAt: new Date() })
  ),
};
