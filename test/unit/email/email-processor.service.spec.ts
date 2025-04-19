import { Test, TestingModule } from '@nestjs/testing';
import { EmailProcessorService } from '../../../src/email/email-processor.service';
import { getModelToken } from '@nestjs/mongoose';
import { ProcessedEmail, ProcessingStatus } from '../../../src/schemas/processed-email.entity';
import { UserService } from '../../../src/user/user.service';
import { EmailService } from '../../../src/email/email.service';
import { AIService } from '../../../src/ai/ai.service';
import { IntentionService } from '../../../src/admin/intention.service';
import { PriceService } from '../../../src/admin/price.service';
import { ActionService } from '../../../src/action/action.service';
import { ConfigService } from '@nestjs/config';
import { createMockUser, createMockObjectId } from '../../utils/test.utils';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { Types, Model, Document } from 'mongoose';
import { User } from '../../../src/schemas/user.entity';
import { Query } from 'mongoose';

describe('EmailProcessorService', () => {
  let service: EmailProcessorService;
  let mockUserService: jest.Mocked<Pick<UserService, 'findAll' | 'findOne' | 'getDecryptedEmailPassword'>>;
  let mockEmailService: jest.Mocked<Pick<EmailService, 'fetchEmails' | 'findProcessedEmailById' | 'markEmailAsProcessed' | 'saveProcessedEmail'>>;
  let mockAIService: jest.Mocked<Pick<AIService, 'detectIntention' | 'extractInformation'>>;
  let mockIntentionService: jest.Mocked<Pick<IntentionService, 'findAll'>>;
  let mockActionService: jest.Mocked<Pick<ActionService, 'create'>>;
  let mockProcessedEmailModel: Model<ProcessedEmail & Document>;
  let mockConfigService: jest.Mocked<Pick<ConfigService, 'get'>>;

  const createMockObjectId = () => new Types.ObjectId();

  const mockUser: User = {
    id: createMockObjectId().toString(),
    email: 'test@example.com',
    password: 'hashedPassword',
    emailPassword: 'encryptedPassword',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockProcessedEmail: ProcessedEmail & { _id: Types.ObjectId } = {
    _id: createMockObjectId(),
    user: mockUser.id,
    emailId: 'test-message-id',
    subject: 'Test Subject',
    sender: 'sender@example.com',
    recipients: ['recipient@example.com'],
    content: 'Test email content',
    htmlContent: '<p>Test email content</p>',
    receivedDate: new Date(),
    intention: 'test-intention',
    extractedData: {},
    status: ProcessingStatus.PENDING,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    mockUserService = {
      findAll: jest.fn().mockResolvedValue([mockUser]),
      findOne: jest.fn().mockResolvedValue(mockUser),
      getDecryptedEmailPassword: jest.fn().mockResolvedValue('password'),
    };

    mockEmailService = {
      fetchEmails: jest.fn().mockResolvedValue([]),
      findProcessedEmailById: jest.fn().mockResolvedValue(mockProcessedEmail),
      markEmailAsProcessed: jest.fn().mockResolvedValue(mockProcessedEmail),
      saveProcessedEmail: jest.fn().mockImplementation((data: Partial<ProcessedEmail>) => 
        Promise.resolve({ ...mockProcessedEmail, ...data } as ProcessedEmail)
      ),
    };

    mockAIService = {
      detectIntention: jest.fn().mockResolvedValue({ detectedIntention: 'test' }),
      extractInformation: jest.fn().mockResolvedValue({ data: 'test' }),
    };

    mockIntentionService = {
      findAll: jest.fn().mockResolvedValue([]),
    };

    mockActionService = {
      create: jest.fn().mockResolvedValue({ id: createMockObjectId().toString() }),
    };

    mockConfigService = {
      get: jest.fn().mockImplementation((key: string) => {
        const config = {
          EMAIL_FETCH_INTERVAL: 300000,
        };
        return config[key as keyof typeof config];
      }),
    };

    const mockQuery = {
      populate: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([mockProcessedEmail]),
    } as unknown as Query<ProcessedEmail[], ProcessedEmail>;

    mockProcessedEmailModel = {
      find: jest.fn().mockReturnValue(mockQuery),
      findOne: jest.fn().mockReturnValue(mockQuery),
      findById: jest.fn().mockReturnValue(mockQuery),
      create: jest.fn().mockImplementation((data) => Promise.resolve({ ...mockProcessedEmail, ...data })),
      save: jest.fn().mockImplementation((data) => Promise.resolve(data)),
    } as unknown as Model<ProcessedEmail & Document>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailProcessorService,
        {
          provide: UserService,
          useValue: mockUserService,
        },
        {
          provide: EmailService,
          useValue: mockEmailService,
        },
        {
          provide: AIService,
          useValue: mockAIService,
        },
        {
          provide: IntentionService,
          useValue: mockIntentionService,
        },
        {
          provide: ActionService,
          useValue: mockActionService,
        },
        {
          provide: getModelToken(ProcessedEmail.name),
          useValue: mockProcessedEmailModel,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<EmailProcessorService>(EmailProcessorService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('fetchNewEmails', () => {
    it('should fetch and save new emails for all users', async () => {
      const mockEmails = [
        { subject: 'Test Email 1', content: 'Test Body 1' },
        { subject: 'Test Email 2', content: 'Test Body 2' },
      ];

      mockUserService.findAll.mockResolvedValue([mockUser]);
      mockUserService.getDecryptedEmailPassword.mockResolvedValue('password123');
      mockEmailService.fetchEmails.mockResolvedValue(mockEmails);
      mockEmailService.saveProcessedEmail.mockImplementation((data) => data);

      await service.fetchNewEmails();

      expect(mockUserService.findAll).toHaveBeenCalled();
      expect(mockUserService.getDecryptedEmailPassword).toHaveBeenCalledWith(mockUser.id);
      expect(mockEmailService.fetchEmails).toHaveBeenCalledWith(mockUser.id);
      expect(mockEmailService.saveProcessedEmail).toHaveBeenCalledTimes(2);
    });

    it('should handle empty user list', async () => {
      mockUserService.findAll.mockResolvedValue([]);

      await service.fetchNewEmails();

      expect(mockUserService.getDecryptedEmailPassword).not.toHaveBeenCalled();
      expect(mockEmailService.fetchEmails).not.toHaveBeenCalled();
    });

    it('should handle IMAP connection errors', async () => {
      mockUserService.findAll.mockResolvedValue([mockUser]);
      mockUserService.getDecryptedEmailPassword.mockResolvedValue('password123');
      mockEmailService.fetchEmails.mockRejectedValue(new Error('IMAP connection failed'));

      await service.fetchNewEmails();
      expect(mockEmailService.fetchEmails).toHaveBeenCalled();
    });

    it('should handle password decryption errors', async () => {
      mockUserService.findAll.mockResolvedValue([mockUser]);
      mockUserService.getDecryptedEmailPassword.mockRejectedValue(new Error('Decryption failed'));

      await service.fetchNewEmails();
      expect(mockEmailService.fetchEmails).not.toHaveBeenCalled();
    });
  });

  describe('processEmails', () => {
    it('should process pending emails', async () => {
      mockProcessedEmailModel.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([mockProcessedEmail]),
      });

      mockAIService.detectIntention.mockResolvedValue({
        confidence: 0.9,
        detectedIntention: 'meeting_request',
        rawResponse: 'test response',
      });

      mockAIService.extractInformation.mockResolvedValue({
        date: '2024-01-01',
        time: '10:00',
      });

      mockIntentionService.findAll.mockResolvedValue([{
        _id: createMockObjectId(),
        name: 'meeting_request',
      }]);

      await service.processEmails();

      expect(mockProcessedEmailModel.find).toHaveBeenCalledWith({ status: ProcessingStatus.PENDING, isActive: true });
      expect(mockAIService.detectIntention).toHaveBeenCalled();
      expect(mockAIService.extractInformation).toHaveBeenCalled();
      expect(mockIntentionService.findAll).toHaveBeenCalled();
    });

    it('should handle AI service errors', async () => {
      mockProcessedEmailModel.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([mockProcessedEmail]),
      });

      mockAIService.detectIntention.mockRejectedValue(new Error('AI service error'));

      await service.processEmails();

      expect(mockEmailService.markEmailAsProcessed).toHaveBeenCalledWith(
        mockProcessedEmail._id.toString(),
        ProcessingStatus.ERROR,
        { error: 'AI service error' },
      );
    });

    it('should handle intention not found', async () => {
      mockProcessedEmailModel.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([mockProcessedEmail]),
      });

      mockAIService.detectIntention.mockResolvedValue({
        confidence: 0.9,
        detectedIntention: 'unknown_intention',
        rawResponse: 'test response',
      });

      mockIntentionService.findAll.mockResolvedValue([]);

      await service.processEmails();

      expect(mockEmailService.markEmailAsProcessed).toHaveBeenCalledWith(
        mockProcessedEmail._id.toString(),
        ProcessingStatus.NO_MATCH,
        { aiResult: { confidence: 0.9, detectedIntention: 'unknown_intention', rawResponse: 'test response' } },
      );
    });
  });

  describe('manualProcess', () => {
    it('should throw BadRequestException if email is already processed', async () => {
      const processedEmail = {
        ...mockProcessedEmail,
        status: ProcessingStatus.PROCESSED,
      };

      mockEmailService.findProcessedEmailById.mockResolvedValue(processedEmail);

      await expect(service.manualProcess(mockProcessedEmail._id.toString()))
        .rejects
        .toThrow(new BadRequestException('Email is already processed'));
    });

    it('should handle AI service errors during manual processing', async () => {
      const pendingEmail = {
        ...mockProcessedEmail,
        status: ProcessingStatus.PENDING,
      };

      mockEmailService.findProcessedEmailById.mockResolvedValue(pendingEmail);
      mockAIService.detectIntention.mockRejectedValue(new Error('AI service error'));

      await service.manualProcess(mockProcessedEmail._id.toString());

      expect(mockEmailService.markEmailAsProcessed).toHaveBeenCalledWith(
        mockProcessedEmail._id.toString(),
        ProcessingStatus.ERROR,
        { error: 'AI service error' },
      );
    });

    it('should handle email not found', async () => {
      mockEmailService.findProcessedEmailById.mockResolvedValue(null);

      await expect(service.manualProcess(mockProcessedEmail._id.toString()))
        .rejects
        .toThrow(new BadRequestException('Email not found'));
    });

    it('should handle intention extraction errors', async () => {
      const pendingEmail = {
        ...mockProcessedEmail,
        status: ProcessingStatus.PENDING,
      };

      mockEmailService.findProcessedEmailById.mockResolvedValue(pendingEmail);
      mockAIService.detectIntention.mockResolvedValue({
        confidence: 0.9,
        detectedIntention: 'meeting_request',
        rawResponse: 'test response',
      });
      mockAIService.extractInformation.mockRejectedValue(new Error('Extraction error'));

      await service.manualProcess(mockProcessedEmail._id.toString());

      expect(mockEmailService.markEmailAsProcessed).toHaveBeenCalledWith(
        mockProcessedEmail._id.toString(),
        ProcessingStatus.ERROR,
        { error: 'Extraction error' },
      );
    });

    it('should handle successful manual processing', async () => {
      const pendingEmail = {
        ...mockProcessedEmail,
        status: ProcessingStatus.PENDING,
      };

      const aiResult = {
        confidence: 0.9,
        detectedIntention: 'meeting_request',
        rawResponse: 'test response',
      };

      const extractedInfo = {
        date: '2024-03-20',
        time: '14:00',
      };

      mockEmailService.findProcessedEmailById.mockResolvedValue(pendingEmail);
      mockAIService.detectIntention.mockResolvedValue(aiResult);
      mockAIService.extractInformation.mockResolvedValue(extractedInfo);
      mockIntentionService.findAll.mockResolvedValue([{
        _id: createMockObjectId(),
        name: 'meeting_request',
      }]);

      await service.manualProcess(mockProcessedEmail._id.toString());

      expect(mockEmailService.markEmailAsProcessed).toHaveBeenCalledWith(
        mockProcessedEmail._id.toString(),
        ProcessingStatus.PROCESSED,
        {
          aiResult,
          extractedInfo,
          intention: expect.objectContaining({ name: 'meeting_request' }),
        },
      );
    });
  });
});
