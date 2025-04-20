import { registerAs } from '@nestjs/config';
import * as dotenv from 'dotenv';

// Load the appropriate .env file based on NODE_ENV
const envFile = process.env.NODE_ENV === 'production' 
  ? '.env.production' 
  : '.env.local';

console.log(`Loading environment from ${envFile}`);
dotenv.config({ path: envFile });

export const databaseConfig = registerAs('database', () => ({
  uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/ship-mvp',
}));

export const emailConfig = registerAs('email', () => ({
  pollingIntervalMs: parseInt(process.env.EMAIL_POLLING_INTERVAL_MS || '60000', 10),
  maxRetries: parseInt(process.env.EMAIL_MAX_RETRIES || '3', 10),
  retryDelayMs: parseInt(process.env.EMAIL_RETRY_DELAY_MS || '5000', 10),
  stub: process.env.STUB_EMAIL === 'true',
}));

export const aiConfig = registerAs('ai', () => ({
  defaultProvider: process.env.DEFAULT_AI_PROVIDER || 'gemini',
  stub: process.env.STUB_AI === 'true',
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    model: process.env.OPENAI_MODEL || 'gpt-4',
    maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || '2000', 10),
  },
  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY || '',
    model: process.env.ANTHROPIC_MODEL || 'claude-3-opus-20240229',
    maxTokens: parseInt(process.env.ANTHROPIC_MAX_TOKENS || '2000', 10),
  },
  gemini: {
    apiKey: process.env.GOOGLE_API_KEY || '',
    model: process.env.GOOGLE_MODEL || 'gemini-pro',
    maxTokens: parseInt(process.env.GOOGLE_MAX_TOKENS || '2000', 10),
  },
}));

export const encryptionConfig = registerAs('encryption', () => ({
  secret: process.env.ENCRYPTION_SECRET || 'your-secret-key',
  algorithm: process.env.ENCRYPTION_ALGORITHM || 'aes-256-cbc',
}));

export default () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  environment: process.env.NODE_ENV || 'development',
  database: databaseConfig(),
  email: emailConfig(),
  ai: aiConfig(),
  encryption: encryptionConfig(),
});