import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EmailService } from '../../../src/email/email.service';
import { ProcessedEmail, ProcessingStatus } from '../../../src/schemas/processed-email.entity';
import { User } from '../../../src/schemas/user.entity';
import { createMockUser, createMockProcessedEmail, createMockObjectId } from '../../utils/test.utils';
import { mockUserRegular } from '../../mocks/users.mock';
import * as Imap from 'imap';
import { Types } from 'mongoose';
import { UserService } from '../../../src/user/user.service';

jest.mock('imap');

const mockUserService = {
  findOne: jest.fn().mockResolvedValue({ email: 'test@example.com' }),
  getDecryptedEmailPassword: jest.fn().mockResolvedValue('password123'),
};

describe('EmailService', () => {
  let service: EmailService;
  let mockProcessedEmailModel: any;
  let mockUserModel: any;
  let processedEmailModel: Model<ProcessedEmail>;

  const mockUser = createMockUser();
  const mockEmail = createMockProcessedEmail({
    user: mockUser._id,
    subject: 'Test Email',
    content: 'Test content',
  });

  beforeEach(async () => {
    mockProcessedEmailModel = {
      create: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      findById: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      countDocuments: jest.fn().mockResolvedValue(1),
    };

    mockUserModel = {
      findById: jest.fn(),
      findByIdAndUpdate: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        {
          provide: getModelToken(ProcessedEmail.name),
          useValue: mockProcessedEmailModel,
        },
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel,
        },
        {
          provide: UserService,
          useValue: mockUserService,
        },
      ],
    }).compile();

    service = module.get<EmailService>(EmailService);
    processedEmailModel = module.get<Model<ProcessedEmail>>(
      getModelToken(ProcessedEmail.name),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('fetchEmails', () => {
    it('should fetch and save new emails', async () => {
      const mockImapConnection = {
        connect: jest.fn(),
        openBox: jest.fn((box, readonly, cb) => cb(null)),
        search: jest.fn((criteria, cb) => cb(null, [1])),
        fetch: jest.fn((ids, options) => ({
          on: jest.fn(),
        })),
        end: jest.fn(),
      };

      (Imap as any).mockImplementation(() => mockImapConnection);
      mockUserService.findOne.mockResolvedValue(mockUser);
      mockUserService.getDecryptedEmailPassword.mockResolvedValue('decrypted_password');
      mockProcessedEmailModel.create.mockResolvedValue(mockEmail);

      const result = await service.fetchEmails(mockUser._id.toString());

      expect(result).toBeDefined();
      expect(mockImapConnection.connect).toHaveBeenCalled();
      expect(mockUserService.findOne).toHaveBeenCalledWith(mockUser._id.toString());
      expect(mockUserService.getDecryptedEmailPassword).toHaveBeenCalledWith(mockUser._id.toString());
      expect(mockProcessedEmailModel.create).toHaveBeenCalled();
    });

    it('should handle IMAP connection errors', async () => {
      const mockImapConnection = {
        connect: jest.fn(() => {
          throw new Error('Connection failed');
        }),
      };

      (Imap as any).mockImplementation(() => mockImapConnection);
      mockUserService.findOne.mockResolvedValue(mockUser);
      mockUserService.getDecryptedEmailPassword.mockResolvedValue('decrypted_password');

      await expect(service.fetchEmails(mockUser._id.toString()))
        .rejects
        .toThrow('Failed to connect to email server');
      
      expect(mockUserService.findOne).toHaveBeenCalledWith(mockUser._id.toString());
      expect(mockUserService.getDecryptedEmailPassword).toHaveBeenCalledWith(mockUser._id.toString());
    });

    it('should handle user not found error', async () => {
      mockUserService.findOne.mockResolvedValue(null);

      await expect(service.fetchEmails(mockUser._id.toString()))
        .rejects
        .toThrow('User not found');
      
      expect(mockUserService.findOne).toHaveBeenCalledWith(mockUser._id.toString());
      expect(mockUserService.getDecryptedEmailPassword).not.toHaveBeenCalled();
    });

    it('should handle password decryption error', async () => {
      mockUserService.findOne.mockResolvedValue(mockUser);
      mockUserService.getDecryptedEmailPassword.mockRejectedValue(new Error('Decryption failed'));

      await expect(service.fetchEmails(mockUser._id.toString()))
        .rejects
        .toThrow('Failed to decrypt email password');
      
      expect(mockUserService.findOne).toHaveBeenCalledWith(mockUser._id.toString());
      expect(mockUserService.getDecryptedEmailPassword).toHaveBeenCalledWith(mockUser._id.toString());
    });
  });

  describe('saveProcessedEmail', () => {
    it('should save a new processed email', async () => {
      const emailData = {
        user: mockUser._id,
        subject: 'Test Subject',
        content: 'Test Content',
        status: ProcessingStatus.PENDING,
      };

      mockProcessedEmailModel.create.mockResolvedValue(mockEmail);

      const result = await service.saveProcessedEmail(emailData);

      expect(result).toBeDefined();
      expect(result.subject).toBe(mockEmail.subject);
      expect(mockProcessedEmailModel.create).toHaveBeenCalledWith(emailData);
    });

    it('should handle save errors', async () => {
      mockProcessedEmailModel.create.mockRejectedValue(new Error('Save failed'));

      await expect(service.saveProcessedEmail({
        user: mockUser._id,
        subject: 'Test',
        content: 'Test',
      }))
        .rejects
        .toThrow('Failed to save processed email');
    });
  });

  describe('markEmailAsProcessed', () => {
    it('should update processed email status', async () => {
      const mockIntentionId = createMockObjectId();
      const updateData = {
        status: ProcessingStatus.PROCESSED,
        processedData: { matchedIntention: mockIntentionId },
      };

      mockProcessedEmailModel.findByIdAndUpdate.mockResolvedValue({
        ...mockEmail,
        ...updateData,
      });

      const result = await service.markEmailAsProcessed(
        mockEmail._id.toString(),
        ProcessingStatus.PROCESSED,
        { matchedIntention: mockIntentionId }
      );

      expect(result).toBeDefined();
      expect(result.status).toBe(ProcessingStatus.PROCESSED);
      expect(mockProcessedEmailModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockEmail._id.toString(),
        {
          $set: {
            status: ProcessingStatus.PROCESSED,
            processedData: { matchedIntention: mockIntentionId },
            processedAt: expect.any(Date),
          },
        },
        { new: true },
      );
    });

    it('should handle update errors', async () => {
      mockProcessedEmailModel.findByIdAndUpdate.mockRejectedValue(new Error('Update failed'));

      await expect(service.markEmailAsProcessed(
        mockEmail._id.toString(),
        ProcessingStatus.ERROR,
        { error: 'Test error' }
      ))
        .rejects
        .toThrow('Failed to update processed email');
    });
  });

  describe('findProcessedEmails', () => {
    it('should get processed emails for a user', async () => {
      mockProcessedEmailModel.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([mockEmail]),
      });

      const result = await service.findProcessedEmails(mockUser._id.toString());

      expect(result).toBeDefined();
      expect(result.total).toBe(1);
      expect(result.emails).toHaveLength(1);
      expect(result.emails[0].subject).toBe(mockEmail.subject);
      expect(mockProcessedEmailModel.find).toHaveBeenCalledWith({
        user: mockUser._id,
      });
    });

    it('should handle query errors', async () => {
      mockProcessedEmailModel.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockRejectedValue(new Error('Query failed')),
      });

      await expect(service.findProcessedEmails(mockUser._id.toString()))
        .rejects
        .toThrow('Failed to get processed emails');
    });
  });
});
