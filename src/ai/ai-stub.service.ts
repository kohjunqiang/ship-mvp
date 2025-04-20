// src/ai/ai-stub.service.ts
import { Injectable } from '@nestjs/common';
import { IntentionDetectionResult } from './interfaces/intention-detection-result.interface';

@Injectable()
export class AIStubService {
  async detectIntention(subject: string, content: string): Promise<IntentionDetectionResult> {
    // Simple keyword matching for demonstration
    const lowercaseContent = content.toLowerCase();
    
    if (lowercaseContent.includes('meeting') || lowercaseContent.includes('schedule')) {
      return {
        detectedIntention: 'meeting_request',
        confidence: 0.95,
        rawResponse: { mock: true }
      };
    }
    
    if (lowercaseContent.includes('quote') || lowercaseContent.includes('price')) {
      return {
        detectedIntention: 'quote_request',
        confidence: 0.9,
        rawResponse: { mock: true }
      };
    }
    
    return {
      detectedIntention: 'general_inquiry',
      confidence: 0.7,
      rawResponse: { mock: true }
    };
  }
  
  async extractInformation(
    subject: string, 
    content: string, 
    fields: string[]
  ): Promise<Record<string, any>> {
    // Mock data extraction
    const result: Record<string, any> = {};
    
    fields.forEach(field => {
      switch (field) {
        case 'date':
          result[field] = 'tomorrow';
          break;
        case 'time':
          result[field] = '2:00 PM';
          break;
        case 'quantity':
          result[field] = '5';
          break;
        case 'location':
          result[field] = 'Shanghai to Rotterdam';
          break;
        default:
          result[field] = null;
      }
    });
    
    return result;
  }
}