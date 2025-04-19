import { Test, TestingModule } from '@nestjs/testing';
import { AIService } from '../../../src/ai/ai.service';
import { GeminiService } from '../../../src/ai/providers/gemini.service';
import { OpenAIService } from '../../../src/ai/providers/openai.service';
import { AnthropicService } from '../../../src/ai/providers/anthropic.service';
import { mockAIResponses } from '../../mocks/ai-responses.mock';
import { ConfigService } from '@nestjs/config';

describe('AIService', () => {
  let service: AIService;
  let geminiService: GeminiService;
  let openaiService: OpenAIService;
  let anthropicService: AnthropicService;

  const mockGeminiService = {
    detectIntention: jest.fn(),
    extractInformation: jest.fn(),
  };

  const mockOpenAIService = {
    detectIntention: jest.fn(),
    extractInformation: jest.fn(),
  };

  const mockAnthropicService = {
    detectIntention: jest.fn(),
    extractInformation: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AIService,
        {
          provide: GeminiService,
          useValue: mockGeminiService,
        },
        {
          provide: OpenAIService,
          useValue: mockOpenAIService,
        },
        {
          provide: AnthropicService,
          useValue: mockAnthropicService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<AIService>(AIService);
    geminiService = module.get<GeminiService>(GeminiService);
    openaiService = module.get<OpenAIService>(OpenAIService);
    anthropicService = module.get<AnthropicService>(AnthropicService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('detectIntention', () => {
    const testEmail = {
      subject: 'Meeting Request',
      content: 'Can we schedule a meeting tomorrow?',
    };

    it('should successfully detect intention using primary provider', async () => {
      mockGeminiService.detectIntention.mockResolvedValue(mockAIResponses.meetingRequest);
      mockConfigService.get.mockReturnValue('gemini');

      const result = await service.detectIntention(testEmail.subject, testEmail.content);

      expect(result).toEqual(mockAIResponses.meetingRequest);
      expect(mockGeminiService.detectIntention).toHaveBeenCalledWith(
        testEmail.subject,
        testEmail.content,
      );
    });

    it('should fallback to secondary provider if primary fails', async () => {
      mockConfigService.get.mockReturnValue('gemini');
      mockGeminiService.detectIntention.mockRejectedValue(new Error('Primary provider error'));
      mockOpenAIService.detectIntention.mockResolvedValue(mockAIResponses.meetingRequest);

      const result = await service.detectIntention(testEmail.subject, testEmail.content);

      expect(result).toEqual(mockAIResponses.meetingRequest);
      expect(mockGeminiService.detectIntention).toHaveBeenCalled();
      expect(mockOpenAIService.detectIntention).toHaveBeenCalled();
    });

    it('should throw error if all providers fail', async () => {
      mockConfigService.get.mockReturnValue('gemini');
      mockGeminiService.detectIntention.mockRejectedValue(new Error('Primary provider error'));
      mockOpenAIService.detectIntention.mockRejectedValue(new Error('Secondary provider error'));
      mockAnthropicService.detectIntention.mockRejectedValue(new Error('Tertiary provider error'));

      await expect(service.detectIntention(testEmail.subject, testEmail.content))
        .rejects
        .toThrow('All AI providers failed');
    });
  });

  describe('extractInformation', () => {
    const testData = {
      subject: 'Meeting Request',
      content: 'Meeting tomorrow at 2 PM',
      fields: ['date', 'time'],
    };

    it('should successfully extract information using primary provider', async () => {
      mockConfigService.get.mockReturnValue('gemini');
      mockGeminiService.extractInformation.mockResolvedValue({
        date: 'tomorrow',
        time: '2 PM',
      });

      const result = await service.extractInformation(
        testData.subject,
        testData.content,
        testData.fields,
      );

      expect(result).toEqual({
        date: 'tomorrow',
        time: '2 PM',
      });
      expect(mockGeminiService.extractInformation).toHaveBeenCalledWith(
        testData.subject,
        testData.content,
        testData.fields,
      );
    });

    it('should fallback to secondary provider if primary fails', async () => {
      mockConfigService.get.mockReturnValue('gemini');
      mockGeminiService.extractInformation.mockRejectedValue(new Error('Primary provider error'));
      mockOpenAIService.extractInformation.mockResolvedValue({
        date: 'tomorrow',
        time: '2 PM',
      });

      const result = await service.extractInformation(
        testData.subject,
        testData.content,
        testData.fields,
      );

      expect(result).toEqual({
        date: 'tomorrow',
        time: '2 PM',
      });
      expect(mockGeminiService.extractInformation).toHaveBeenCalled();
      expect(mockOpenAIService.extractInformation).toHaveBeenCalled();
    });

    it('should throw error if all providers fail', async () => {
      mockConfigService.get.mockReturnValue('gemini');
      mockGeminiService.extractInformation.mockRejectedValue(new Error('Primary provider error'));
      mockOpenAIService.extractInformation.mockRejectedValue(new Error('Secondary provider error'));
      mockAnthropicService.extractInformation.mockRejectedValue(new Error('Tertiary provider error'));

      await expect(service.extractInformation(
        testData.subject,
        testData.content,
        testData.fields,
      )).rejects.toThrow('All AI providers failed');
    });
  });
});
