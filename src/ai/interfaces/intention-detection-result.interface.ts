export interface IntentionDetectionResult {
  detectedIntention: string;
  confidence: number;
  rawResponse?: any;
  extractedFields?: Record<string, any>;
}
