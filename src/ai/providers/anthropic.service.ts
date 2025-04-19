import { Injectable } from '@nestjs/common';
import { AIProvider } from '../interfaces/ai-provider.interface';
import { IntentionDetectionResult } from '../interfaces/intention-detection-result.interface';

@Injectable()
export class AnthropicService implements AIProvider {
  async detectIntention(subject: string, content: string): Promise<IntentionDetectionResult> {
    throw new Error('Anthropic provider not implemented');
  }

  async extractInformation(
    subject: string,
    content: string,
    fields: string[],
  ): Promise<Record<string, any>> {
    throw new Error('Anthropic provider not implemented');
  }
}
