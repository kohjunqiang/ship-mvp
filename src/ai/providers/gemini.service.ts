import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
  GenerativeModel,
} from '@google/generative-ai';
import { AIProvider } from '../interfaces/ai-provider.interface';
import { IntentionDetectionResult } from '../interfaces/intention-detection-result.interface';

@Injectable()
export class GeminiService implements AIProvider {
  private readonly genAI: GoogleGenerativeAI;
  private readonly model: GenerativeModel;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('ai.gemini.apiKey');
    if (!apiKey) {
      throw new Error('Gemini API key not found');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
  }

  private async generateStructuredResponse(
    prompt: string,
    responseFormat: Record<string, any>,
  ): Promise<Record<string, any>> {
    const generationConfig = {
      temperature: 0.7,
      topK: 1,
      topP: 1,
      maxOutputTokens: 2048,
    };

    const safetySettings = [
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
    ];

    const structuredPrompt = `
    ${prompt}
    
    Please provide your response in the following JSON format:
    ${JSON.stringify(responseFormat, null, 2)}
    
    Ensure your response is valid JSON and follows this exact structure.`;

    const result = await this.model.generateContent({
      contents: [{ role: 'user', parts: [{ text: structuredPrompt }] }],
      generationConfig,
      safetySettings,
    });

    const response = result.response;
    const text = response.text();
    
    try {
      // Extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      return JSON.parse(jsonMatch[0]) as Record<string, any>;
    } catch (error) {
      console.error('Error parsing Gemini response:', error);
      throw new Error('Failed to parse structured response from Gemini');
    }
  }

  async detectIntention(subject: string, content: string): Promise<IntentionDetectionResult> {
    const prompt = `
    Analyze the following email to detect its primary intention.
    
    Subject: ${subject}
    Content: ${content}
    
    Based on the email's content and subject, determine the main intention or purpose.
    Consider factors like tone, urgency, and specific requests or actions mentioned.
    Provide a confidence score between 0 and 1 indicating how certain you are about this intention.`;

    const responseFormat = {
      detectedIntention: 'string - a brief label for the detected intention',
      confidence: 'number between 0 and 1',
      reasoning: 'string - brief explanation of why this intention was detected',
    };

    const result = await this.generateStructuredResponse(prompt, responseFormat);
    
    return {
      detectedIntention: result.detectedIntention as string,
      confidence: result.confidence as number,
      rawResponse: result,
    };
  }

  async extractInformation(
    subject: string,
    content: string,
    fields: string[],
  ): Promise<Record<string, any>> {
    const prompt = `
    Extract specific information from the following email:
    
    Subject: ${subject}
    Content: ${content}
    
    Please extract values for these fields: ${fields.join(', ')}
    For each field, provide the extracted value and a confidence score between 0 and 1.
    If a field cannot be found, set its value to null and confidence to 0.`;

    const responseFormat = fields.reduce((acc, field) => {
      acc[field] = {
        value: 'extracted value or null',
        confidence: 'number between 0 and 1',
      };
      return acc;
    }, {} as Record<string, any>);

    const result = await this.generateStructuredResponse(prompt, responseFormat);
    
    // Convert the result into a simple key-value format
    return Object.entries(result).reduce((acc, [key, value]) => {
      if (value && typeof value === 'object' && 'value' in value) {
        acc[key] = value.value;
      } else {
        acc[key] = null;
      }
      return acc;
    }, {} as Record<string, any>);
  }
}
