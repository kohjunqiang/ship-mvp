import { IntentionDetectionResult } from '../../src/ai/interfaces/intention-detection-result.interface';

export const mockAIResponses: Record<string, IntentionDetectionResult> = {
  meetingRequest: {
    detectedIntention: 'Meeting Request',
    confidence: 0.95,
    rawResponse: {
      detectedIntention: 'Meeting Request',
      confidence: 0.95,
      reasoning: 'Email contains meeting scheduling request with time and topic discussion.',
    },
    extractedFields: {
      proposedDate: 'next week',
      duration: '1 hour',
      topic: 'project progress',
      attendees: ['sender@example.com', 'user1@example.com'],
    },
  },
  invoicePayment: {
    detectedIntention: 'Invoice Payment',
    confidence: 0.98,
    rawResponse: {
      detectedIntention: 'Invoice Payment',
      confidence: 0.98,
      reasoning: 'Email contains invoice number, amount, and payment request.',
    },
    extractedFields: {
      invoiceNumber: '12345',
      amount: 500,
      currency: 'USD',
      dueDate: '2025-04-30',
    },
  },
  noMatch: {
    detectedIntention: 'Unknown',
    confidence: 0.3,
    rawResponse: {
      detectedIntention: 'Unknown',
      confidence: 0.3,
      reasoning: 'Email content does not match any known intention patterns.',
    },
    extractedFields: {},
  },
};

export const mockAIService = {
  detectIntention: jest.fn().mockImplementation((subject: string, content: string) => {
    if (subject.toLowerCase().includes('meeting')) {
      return Promise.resolve(mockAIResponses.meetingRequest);
    }
    if (subject.toLowerCase().includes('invoice')) {
      return Promise.resolve(mockAIResponses.invoicePayment);
    }
    return Promise.resolve(mockAIResponses.noMatch);
  }),
  extractInformation: jest.fn().mockImplementation((subject: string, content: string, fields: string[]) => {
    if (subject.toLowerCase().includes('meeting')) {
      return Promise.resolve(mockAIResponses.meetingRequest.extractedFields);
    }
    if (subject.toLowerCase().includes('invoice')) {
      return Promise.resolve(mockAIResponses.invoicePayment.extractedFields);
    }
    return Promise.resolve({});
  }),
};
