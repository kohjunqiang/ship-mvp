import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { GeminiService } from '../../../../src/ai/providers/gemini.service';
import { mockAIResponses } from '../../../mocks/ai-responses.mock';

describe('GeminiService', () => {
  let service: GeminiService;
  let configService: ConfigService;

  const mockConfigService = {
    get: jest.fn().mockReturnValue('mock-api-key'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GeminiService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<GeminiService>(GeminiService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('detectIntention', () => {
    it('should detect intention from email content', async () => {
      const subject = 'Meeting Request';
      const content = 'Can we schedule a meeting tomorrow at 2 PM?';

      const mockResponse = {
        detectedIntention: "Meeting Request",
        confidence: 0.95,
        reasoning: "Email contains meeting scheduling request with time and topic discussion."
      };

      jest.spyOn(service as any, 'generateStructuredResponse').mockResolvedValue(mockResponse);

      const result = await service.detectIntention(subject, content);

      expect(result).toEqual({
        detectedIntention: "Meeting Request",
        confidence: 0.95,
        rawResponse: mockResponse
      });
      expect((service as any)['generateStructuredResponse']).toHaveBeenCalledWith(
        expect.stringContaining('Analyze the following email'),
        expect.objectContaining({
          detectedIntention: expect.any(String),
          confidence: expect.any(String),
          reasoning: expect.any(String)
        })
      );
    });

    it('should handle API errors', async () => {
      const subject = 'Meeting Request';
      const content = 'Can we schedule a meeting tomorrow at 2 PM?';

      jest.spyOn(service as any, 'generateStructuredResponse').mockRejectedValue(new Error('API error'));

      await expect(service.detectIntention(subject, content))
        .rejects
        .toThrow('API error');
    });
  });

  describe('extractInformation', () => {
    it('should extract information from email content', async () => {
      const subject = 'Meeting Request';
      const content = 'Can we schedule a meeting tomorrow at 2 PM?';
      const fields = ['date', 'time'];

      const mockResponse = {
        date: {
          value: 'tomorrow',
          confidence: 0.95
        },
        time: {
          value: '2 PM',
          confidence: 0.95
        }
      };

      jest.spyOn(service as any, 'generateStructuredResponse').mockResolvedValue(mockResponse);

      const result = await service.extractInformation(subject, content, fields);

      expect(result).toEqual({
        date: 'tomorrow',
        time: '2 PM'
      });
      expect((service as any)['generateStructuredResponse']).toHaveBeenCalledWith(
        expect.stringContaining('Extract specific information'),
        expect.objectContaining({
          date: expect.objectContaining({
            value: expect.any(String),
            confidence: expect.any(String)
          }),
          time: expect.objectContaining({
            value: expect.any(String),
            confidence: expect.any(String)
          })
        })
      );
    });

    it('should handle API errors', async () => {
      const subject = 'Meeting Request';
      const content = 'Can we schedule a meeting tomorrow at 2 PM?';
      const fields = ['date', 'time'];

      jest.spyOn(service as any, 'generateStructuredResponse').mockRejectedValue(new Error('API error'));

      await expect(service.extractInformation(subject, content, fields))
        .rejects
        .toThrow('API error');
    });
  });
});
