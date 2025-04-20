import { Test, TestingModule } from '@nestjs/testing';
import { EmailProcessorService } from '../../../src/email/email-processor.service';
import { getModelToken } from '@nestjs/mongoose';
import { ProcessedEmail } from '../../../src/schemas/processed-email.entity';
import { UserService } from '../../../src/user/user.service';
import { EmailService } from '../../../src/email/email.service';
import { AIService } from '../../../src/ai/ai.service';
import { IntentionService } from '../../../src/admin/intention.service';
import { PriceService } from '../../../src/admin/price.service';
import { ActionService } from '../../../src/action/action.service';
import { ConfigService } from '@nestjs/config';
import { createMockUser } from '../../utils/test.utils';
import { ProcessingStatus } from '../../../src/schemas/enums/processing-status.enum';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { Types } from 'mongoose';

describe('EmailProcessorService', () => {
  let service: EmailProcessorService;

  const mockProcessedEmailModel = {
    create: jest.fn(),
    find: jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      exec: jest.fn(),
    }),
    findById: jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      exec: jest.fn(),
    }),
    findByIdAndUpdate: jest.fn().mockReturnValue({
      exec: jest.fn(),
    }),
  };

  const mockUserService = {
    findOne: jest.fn(),
    findAll: jest.fn(),
    getDecryptedEmailPassword: jest.fn(),
    updateStatistics: jest.fn(),
  };

  const mockEmailService = {
    fetchEmails: jest.fn(),
    findProcessedEmailById: jest.fn(),
    saveProcessedEmail: jest.fn(),
    markEmailAsProcessed: jest.fn(),
  };

  const mockAIService = {
    detectIntention: jest.fn(),
    extractInformation: jest.fn(),
  };

  const mockIntentionService = {
    findAll: jest.fn(),
    updateStatistics: jest.fn(),
  };

  const mockPriceService = {
    calculatePrice: jest.fn(),
    findByIntention: jest.fn(),
    incrementUsage: jest.fn(),
  };

  const mockActionService = {
    executeAction: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailProcessorService,
        {
          provide: getModelToken(ProcessedEmail.name),
          useValue: mockProcessedEmailModel,
        },
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
          provide: PriceService,
          useValue: mockPriceService,
        },
        {
          provide: ActionService,
          useValue: mockActionService,
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
      const mockUser = {
        ...createMockUser(),
        _id: new Types.ObjectId(),
      };
      const mockEmails = [
        { subject: 'Test Email 1', body: 'Test Body 1' },
        { subject: 'Test Email 2', body: 'Test Body 2' },
      ];

      mockUserService.findAll.mockResolvedValue([mockUser]);
      mockUserService.getDecryptedEmailPassword.mockResolvedValue('password123');
      mockEmailService.fetchEmails.mockResolvedValue(mockEmails);
      mockEmailService.saveProcessedEmail.mockImplementation((data) => data);

      await service.fetchNewEmails();

      expect(mockUserService.findAll).toHaveBeenCalled();
      expect(mockUserService.getDecryptedEmailPassword).toHaveBeenCalledWith(mockUser._id.toString());
      expect(mockEmailService.fetchEmails).toHaveBeenCalledWith(mockUser._id.toString());
      expect(mockEmailService.saveProcessedEmail).toHaveBeenCalledTimes(2);
    });

    it('should handle empty user list', async () => {
      mockUserService.findAll.mockResolvedValue([]);

      await service.fetchNewEmails();

      expect(mockUserService.getDecryptedEmailPassword).not.toHaveBeenCalled();
      expect(mockEmailService.fetchEmails).not.toHaveBeenCalled();
    });

    it('should handle IMAP connection errors', async () => {
      const mockUser = {
        ...createMockUser(),
        _id: new Types.ObjectId(),
      };
      mockUserService.findAll.mockResolvedValue([mockUser]);
      mockUserService.getDecryptedEmailPassword.mockResolvedValue('password123');
      mockEmailService.fetchEmails.mockRejectedValue(new Error('IMAP connection failed'));

      await service.fetchNewEmails();
      expect(mockEmailService.fetchEmails).toHaveBeenCalled();
    });

    it('should handle password decryption errors', async () => {
      const mockUser = {
        ...createMockUser(),
        _id: new Types.ObjectId(),
      };
      mockUserService.findAll.mockResolvedValue([mockUser]);
      mockUserService.getDecryptedEmailPassword.mockRejectedValue(new Error('Decryption failed'));

      await service.fetchNewEmails();
      expect(mockEmailService.fetchEmails).not.toHaveBeenCalled();
    });
  });

  describe('processEmails', () => {
    it('should process pending emails', async () => {
      const mockUser = {
        ...createMockUser(),
        _id: new Types.ObjectId(),
      };
      const mockEmail = {
        _id: new Types.ObjectId(),
        subject: 'Test Email',
        body: 'Test Body',
        user: mockUser,
        status: ProcessingStatus.PENDING,
      };

      mockProcessedEmailModel.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([mockEmail]),
      });

      mockAIService.detectIntention.mockResolvedValue({
        detectedIntention: 'test_intention',
        confidence: 0.9,
        rawResponse: 'test response',
      });

      mockAIService.extractInformation.mockResolvedValue({
        date: '2024-01-01',
        time: '10:00',
      });

      mockIntentionService.findAll.mockResolvedValue([
        { name: 'test_intention', actions: [], keywords: ['test'], _id: new Types.ObjectId() },
      ]);

      mockPriceService.findByIntention.mockResolvedValue([{ _id: new Types.ObjectId() }]);
      mockActionService.executeAction.mockResolvedValue({ success: true });

      await service.processEmails();

      expect(mockProcessedEmailModel.find).toHaveBeenCalledWith({ status: ProcessingStatus.PENDING, isActive: true });
      expect(mockAIService.detectIntention).toHaveBeenCalled();
      expect(mockAIService.extractInformation).toHaveBeenCalled();
      expect(mockIntentionService.findAll).toHaveBeenCalled();
    });

    it('should handle empty pending emails list', async () => {
      mockProcessedEmailModel.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      });

      await service.processEmails();

      expect(mockAIService.detectIntention).not.toHaveBeenCalled();
      expect(mockAIService.extractInformation).not.toHaveBeenCalled();
    });

    it('should handle AI service errors', async () => {
      const mockUser = {
        ...createMockUser(),
        _id: new Types.ObjectId(),
      };
      const mockEmail = {
        _id: new Types.ObjectId(),
        subject: 'Test Email',
        body: 'Test Body',
        user: mockUser,
        status: ProcessingStatus.PENDING,
      };

      mockProcessedEmailModel.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([mockEmail]),
      });

      mockAIService.detectIntention.mockRejectedValue(new Error('AI service error'));

      await service.processEmails();
      expect(mockEmailService.markEmailAsProcessed).toHaveBeenCalledWith(
        mockEmail._id.toString(),
        ProcessingStatus.ERROR,
        expect.any(Object),
      );
    });

    it('should handle intention not found', async () => {
      const mockUser = {
        ...createMockUser(),
        _id: new Types.ObjectId(),
      };
      const mockEmail = {
        _id: new Types.ObjectId(),
        subject: 'Test Email',
        body: 'Test Body',
        user: mockUser,
        status: ProcessingStatus.PENDING,
      };

      mockProcessedEmailModel.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([mockEmail]),
      });

      mockAIService.detectIntention.mockResolvedValue({
        detectedIntention: 'unknown_intention',
        confidence: 0.9,
        rawResponse: 'test response',
      });

      mockIntentionService.findAll.mockResolvedValue([
        { name: 'test_intention', actions: [], keywords: ['test'], _id: new Types.ObjectId() },
      ]);

      await service.processEmails();

      expect(mockEmailService.markEmailAsProcessed).toHaveBeenCalledWith(
        mockEmail._id.toString(),
        ProcessingStatus.NO_MATCH,
        expect.any(Object),
      );
    });
  });

  describe('manualProcess', () => {
    it('should manually process a specific email', async () => {
      const mockUser = {
        ...createMockUser(),
        _id: new Types.ObjectId(),
      };
      const mockEmail = {
        _id: new Types.ObjectId(),
        subject: 'Test Email',
        body: 'Test Body',
        user: mockUser,
        status: ProcessingStatus.PENDING,
      };

      mockEmailService.findProcessedEmailById.mockResolvedValue(mockEmail);

      mockAIService.detectIntention.mockResolvedValue({
        detectedIntention: 'test_intention',
        confidence: 0.9,
        rawResponse: 'test response',
      });

      mockAIService.extractInformation.mockResolvedValue({
        date: '2024-01-01',
        time: '10:00',
      });

      mockIntentionService.findAll.mockResolvedValue([
        { name: 'test_intention', actions: [], keywords: ['test'], _id: new Types.ObjectId() },
      ]);

      mockPriceService.findByIntention.mockResolvedValue([{ _id: new Types.ObjectId() }]);
      mockActionService.executeAction.mockResolvedValue({ success: true });

      await service.manualProcess(mockEmail._id.toString());

      expect(mockEmailService.findProcessedEmailById).toHaveBeenCalledWith(mockEmail._id.toString());
      expect(mockAIService.detectIntention).toHaveBeenCalled();
      expect(mockAIService.extractInformation).toHaveBeenCalled();
      expect(mockIntentionService.findAll).toHaveBeenCalled();
    });

    it('should throw NotFoundException if email not found', async () => {
      mockEmailService.findProcessedEmailById.mockResolvedValue(null);

      await expect(service.manualProcess('email123'))
        .rejects
        .toThrow(NotFoundException);
    });

    it('should throw BadRequestException if email is already processed', async () => {
      const mockEmail = {
        _id: new Types.ObjectId(),
        subject: 'Test Email',
        body: 'Test Body',
        status: ProcessingStatus.PROCESSED,
      };

      mockEmailService.findProcessedEmailById.mockResolvedValue(mockEmail);

      await expect(service.manualProcess(mockEmail._id.toString()))
        .rejects
        .toThrow(BadRequestException);
    });

    it('should handle AI service errors during manual processing', async () => {
      const mockUser = {
        ...createMockUser(),
        _id: new Types.ObjectId(),
      };
      const mockEmail = {
        _id: new Types.ObjectId(),
        subject: 'Test Email',
        body: 'Test Body',
        user: mockUser,
        status: ProcessingStatus.PENDING,
      };

      mockEmailService.findProcessedEmailById.mockResolvedValue(mockEmail);
      mockAIService.detectIntention.mockRejectedValue(new Error('AI service error'));

      await service.manualProcess(mockEmail._id.toString());
      expect(mockEmailService.markEmailAsProcessed).toHaveBeenCalledWith(
        mockEmail._id.toString(),
        ProcessingStatus.ERROR,
        expect.any(Object),
      );
    });
  });
});
