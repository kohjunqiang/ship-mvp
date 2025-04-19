import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { EmailProcessorService } from '../../src/email/email-processor.service';
import { EmailService } from '../../src/email/email.service';
import { AIService } from '../../src/ai/ai.service';
import { UserService } from '../../src/user/user.service';
import { IntentionService } from '../../src/admin/intention.service';
import { ActionService } from '../../src/admin/action.service';
import { ProcessedEmail } from '../../src/schemas/processed-email.entity';
import { User } from '../../src/schemas/user.entity';
import { Intention } from '../../src/schemas/intention.entity';
import { Action } from '../../src/schemas/action.entity';
import { ProcessingStatus } from '../../src/schemas/enums/processing-status.enum';
import { createMockUser, createMockIntention, createMockProcessedEmail, createMockObjectId } from '../utils/test.utils';
import { mockMeetingIntention } from '../mocks/intentions.mock';
import { PriceService } from '../../src/admin/price.service';
import { ConfigService } from '@nestjs/config';

describe('Email Processing Integration', () => {
  let module: TestingModule;
  let emailProcessorService: EmailProcessorService;
  let emailService: EmailService;
  let aiService: AIService;
  let userService: UserService;
  let intentionService: IntentionService;
  let actionService: ActionService;

  const mockUser = createMockUser();
  const mockIntention = mockMeetingIntention;
  const mockEmail = createMockProcessedEmail({
    user: mockUser._id,
    subject: 'Meeting Request',
    content: 'Can we schedule a meeting tomorrow at 2 PM to discuss the project?',
  });

  const mockModels = {
    ProcessedEmail: {
      create: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      findById: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      exec: jest.fn(),
    },
    User: {
      findById: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      exec: jest.fn(),
    },
    Intention: {
      find: jest.fn(),
      findById: jest.fn(),
      exec: jest.fn(),
    },
    Action: {
      findById: jest.fn(),
      exec: jest.fn(),
    },
  };

  const mockAIService = {
    detectIntention: jest.fn(),
    extractInformation: jest.fn(),
  };

  const mockEmailService = {
    fetchNewEmails: jest.fn(),
    saveProcessedEmail: jest.fn(),
    updateProcessedEmail: jest.fn(),
  };

  const mockActionService = {
    executeAction: jest.fn(),
  };

  const mockPriceService = {
    calculatePrice: jest.fn(),
    findByIntention: jest.fn(),
    incrementUsage: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        EmailProcessorService,
        {
          provide: EmailService,
          useValue: mockEmailService,
        },
        {
          provide: AIService,
          useValue: mockAIService,
        },
        {
          provide: UserService,
          useValue: {
            findOne: jest.fn().mockResolvedValue(mockUser),
            updateStatistics: jest.fn().mockResolvedValue(mockUser),
          },
        },
        {
          provide: IntentionService,
          useValue: {
            findAll: jest.fn().mockResolvedValue([mockIntention]),
            updateStatistics: jest.fn().mockResolvedValue(mockIntention),
          },
        },
        {
          provide: ActionService,
          useValue: mockActionService,
        },
        {
          provide: PriceService,
          useValue: mockPriceService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: getModelToken(ProcessedEmail.name),
          useValue: mockModels.ProcessedEmail,
        },
        {
          provide: getModelToken(User.name),
          useValue: mockModels.User,
        },
        {
          provide: getModelToken(Intention.name),
          useValue: mockModels.Intention,
        },
        {
          provide: getModelToken(Action.name),
          useValue: mockModels.Action,
        },
      ],
    }).compile();

    emailProcessorService = module.get<EmailProcessorService>(EmailProcessorService);
    emailService = module.get<EmailService>(EmailService);
    aiService = module.get<AIService>(AIService);
    userService = module.get<UserService>(UserService);
    intentionService = module.get<IntentionService>(IntentionService);
    actionService = module.get<ActionService>(ActionService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Complete Email Processing Flow', () => {
    it('should process a new email and execute corresponding actions', async () => {
      // Mock email fetching
      mockEmailService.fetchNewEmails.mockResolvedValue([mockEmail]);
      mockEmailService.saveProcessedEmail.mockResolvedValue(mockEmail);

      // Mock AI intention detection
      mockAIService.detectIntention.mockResolvedValue({
        confidence: 0.9,
        intention: 'Meeting Request',
        explanation: 'Email contains meeting scheduling request',
      });

      // Mock AI information extraction
      mockAIService.extractInformation.mockResolvedValue({
        date: 'tomorrow',
        time: '2 PM',
        topic: 'project discussion',
      });

      // Mock action execution
      mockActionService.executeAction.mockResolvedValue({
        success: true,
        message: 'Calendar event created',
      });

      // Execute the email processing flow
      await emailProcessorService.fetchNewEmails();

      // Verify the complete flow
      expect(mockEmailService.fetchNewEmails).toHaveBeenCalled();
      expect(mockAIService.detectIntention).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: mockEmail.subject,
          content: mockEmail.content,
        }),
      );

      expect(mockAIService.extractInformation).toHaveBeenCalledWith(
        expect.objectContaining({
          content: mockEmail.content,
          fields: mockIntention.aiConfig.extractFields,
        }),
      );

      expect(mockActionService.executeAction).toHaveBeenCalled();

      // Verify email status updates
      expect(mockEmailService.updateProcessedEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          _id: mockEmail._id,
          status: ProcessingStatus.PROCESSED,
          matchedIntention: mockIntention._id,
        }),
      );
    });

    it('should handle emails with no matching intentions', async () => {
      const noMatchEmail = createMockProcessedEmail({
        user: mockUser._id,
        subject: 'Random Email',
        content: 'This is a random email with no specific intention.',
      });

      mockEmailService.fetchNewEmails.mockResolvedValue([noMatchEmail]);
      mockEmailService.saveProcessedEmail.mockResolvedValue(noMatchEmail);

      mockAIService.detectIntention.mockResolvedValue({
        confidence: 0.3,
        intention: null,
        explanation: 'No clear intention detected',
      });

      await emailProcessorService.fetchNewEmails();

      expect(mockEmailService.updateProcessedEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          _id: noMatchEmail._id,
          status: ProcessingStatus.NO_MATCH,
        }),
      );

      expect(mockActionService.executeAction).not.toHaveBeenCalled();
    });

    it('should handle processing errors gracefully', async () => {
      const errorEmail = createMockProcessedEmail({
        user: mockUser._id,
        subject: 'Problematic Email',
        content: 'This email will cause an error.',
      });

      mockEmailService.fetchNewEmails.mockResolvedValue([errorEmail]);
      mockEmailService.saveProcessedEmail.mockResolvedValue(errorEmail);

      mockAIService.detectIntention.mockRejectedValue(new Error('AI Service Error'));

      await emailProcessorService.fetchNewEmails();

      expect(mockEmailService.updateProcessedEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          _id: errorEmail._id,
          status: ProcessingStatus.ERROR,
          error: expect.any(String),
        }),
      );
    });
  });
});
