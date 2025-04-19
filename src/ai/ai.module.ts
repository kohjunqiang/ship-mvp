import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AIService } from './ai.service';
import { GeminiService } from './providers/gemini.service';
import { OpenAIService } from './providers/openai.service';
import { AnthropicService } from './providers/anthropic.service';

@Module({
  imports: [ConfigModule],
  providers: [AIService, GeminiService, OpenAIService, AnthropicService],
  exports: [AIService],
})
export class AIModule {}
