import { IntentionDetectionResult } from './intention-detection-result.interface';

export interface AIProvider {
  detectIntention(subject: string, content: string): Promise<IntentionDetectionResult>;
  extractInformation(
    subject: string,
    content: string,
    fields: string[],
  ): Promise<Record<string, any>>;
}
