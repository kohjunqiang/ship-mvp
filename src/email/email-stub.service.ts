// src/email/email-stub.service.ts
import { Injectable } from '@nestjs/common';
import { ProcessedEmail } from '../schemas/processed-email.entity';

@Injectable()
export class EmailStubService {
  async fetchEmails(userId: string): Promise<any[]> {
    // Return mock emails for testing
    return [
      {
        subject: 'Meeting Request',
        text: 'Can we schedule a meeting tomorrow at 2PM to discuss the project?',
        html: '<p>Can we schedule a meeting tomorrow at 2PM to discuss the project?</p>',
        from: { text: 'client@example.com' },
        to: { text: 'me@example.com' },
        date: new Date(),
        messageId: `mock-${Date.now()}-${Math.random()}`,
      },
      {
        subject: 'Quote Request',
        text: 'I need a quote for 5 containers shipping from Shanghai to Rotterdam.',
        html: '<p>I need a quote for 5 containers shipping from Shanghai to Rotterdam.</p>',
        from: { text: 'customer@example.com' },
        to: { text: 'me@example.com' },
        date: new Date(),
        messageId: `mock-${Date.now()}-${Math.random()}`,
      }
    ];
  }

  async saveProcessedEmail(emailData: Partial<ProcessedEmail>): Promise<ProcessedEmail> {
    return emailData as ProcessedEmail;
  }

  async markEmailAsProcessed(id: string, status: string, data: any): Promise<ProcessedEmail> {
    return {
      id,
      status,
      ...data,
    } as unknown as ProcessedEmail;
  }

  async findProcessedEmailById(id: string): Promise<ProcessedEmail | null> {
    return {
      id,
      subject: 'Mock Email',
      content: 'This is a stub email content',
      status: 'pending',
    } as unknown as ProcessedEmail;
  }
}