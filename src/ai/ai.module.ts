// src/ai/ai.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AIService } from './ai.service';
import { AIStubService } from './ai-stub.service';
import { GeminiService } from './providers/gemini.service';
import { OpenAIService } from './providers/openai.service';
import { AnthropicService } from './providers/anthropic.service';

@Module({
  imports: [ConfigModule],
  providers: [
    GeminiService,
    OpenAIService,
    AnthropicService,
    {
      provide: AIService,
      useFactory: (configService: ConfigService, geminiService: GeminiService, 
                  openaiService: OpenAIService, anthropicService: AnthropicService) => {
        return configService.get('ai.stub')
          ? new AIStubService()
          : new AIService(
              configService,
              geminiService,
              openaiService,
              anthropicService
            );
      },
      inject: [ConfigService, GeminiService, OpenAIService, AnthropicService],
    },
  ],
  exports: [AIService],
})
export class AIModule {}