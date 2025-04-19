import { Injectable } from '@nestjs/common';
import { AIProvider } from '../interfaces/ai-provider.interface';
import { IntentionDetectionResult } from '../interfaces/intention-detection-result.interface';

@Injectable()
export class OpenAIService implements AIProvider {
  async detectIntention(subject: string, content: string): Promise<IntentionDetectionResult> {
    throw new Error('OpenAI provider not implemented');
  }

  async extractInformation(
    subject: string,
    content: string,
    fields: string[],
  ): Promise<Record<string, any>> {
    throw new Error('OpenAI provider not implemented');
  }
}
