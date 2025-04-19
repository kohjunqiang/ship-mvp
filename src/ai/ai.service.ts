import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AIProvider } from './interfaces/ai-provider.interface';
import { IntentionDetectionResult } from './interfaces/intention-detection-result.interface';
import { GeminiService } from './providers/gemini.service';
import { OpenAIService } from './providers/openai.service';
import { AnthropicService } from './providers/anthropic.service';

@Injectable()
export class AIService {
  private readonly defaultProvider: string;
  private readonly providers: Map<string, AIProvider>;

  constructor(
    private configService: ConfigService,
    private geminiService: GeminiService,
    private openaiService: OpenAIService,
    private anthropicService: AnthropicService,
  ) {
    this.defaultProvider = this.configService.get<string>('ai.defaultProvider') || 'gemini';
    this.providers = new Map([
      ['gemini', geminiService],
      ['openai', openaiService],
      ['anthropic', anthropicService],
    ]);
  }

  private getProvider(provider?: string): AIProvider {
    const selectedProvider = provider || this.defaultProvider;
    const aiProvider = this.providers.get(selectedProvider);
    
    if (!aiProvider) {
      throw new Error(`AI provider '${selectedProvider}' not found`);
    }
    
    return aiProvider;
  }

  async detectIntention(
    subject: string,
    content: string,
    provider?: string,
  ): Promise<IntentionDetectionResult> {
    const aiProvider = this.getProvider(provider);
    return aiProvider.detectIntention(subject, content);
  }

  async extractInformation(
    subject: string,
    content: string,
    fields: string[],
    provider?: string,
  ): Promise<Record<string, any>> {
    const aiProvider = this.getProvider(provider);
    return aiProvider.extractInformation(subject, content, fields);
  }
}
