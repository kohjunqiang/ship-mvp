import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../../../src/user/user.service';
import { User, UserDocument } from '../../../src/schemas/user.entity';
import { ProcessedEmail, ProcessedEmailDocument } from '../../../src/schemas/processed-email.entity';
import { CreateUserDto } from '../../../src/user/dto/create-user.dto';
import { UpdateUserDto } from '../../../src/user/dto/update-user.dto';
import { createMockUser, createMockObjectId, MockUser } from '../../utils/test.utils';
import * as crypto from 'crypto';
import { ConflictException, NotFoundException, InternalServerErrorException } from '@nestjs/common';

describe('UserService', () => {
  let service: UserService;
  let model: Model<UserDocument>;
  let configService: ConfigService;
  let processedEmailModel: Model<ProcessedEmailDocument>;

  const mockUser: Partial<User> = {
    _id: new Types.ObjectId(),
    email: 'test@example.com',
    emailPassword: 'encrypted_password',
    emailSettings: {
      host: 'imap.example.com',
      port: 993,
      tls: true
    },
    emailsProcessed: 0,
    matchedIntentions: 0,
    lastProcessedAt: null,
    lastError: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    isActive: true
  };

  const mockUserModel = {
    create: jest.fn(),
    findOne: jest.fn(),
    findById: jest.fn(),
    find: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
  };

  const mockProcessedEmailModel = {
    countDocuments: jest.fn(),
    find: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'ENCRYPTION_KEY') return 'test_encryption_key';
      return null;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel,
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

    service = module.get<UserService>(UserService);
    model = module.get<Model<UserDocument>>(getModelToken(User.name));
    configService = module.get<ConfigService>(ConfigService);
    processedEmailModel = module.get<Model<ProcessedEmailDocument>>(getModelToken(ProcessedEmail.name));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(model).toBeDefined();
    expect(configService).toBeDefined();
  });

  describe('create', () => {
    const createUserDto: CreateUserDto = {
      email: 'test@example.com',
      emailPassword: 'password123',
      emailSettings: {
        host: 'imap.example.com',
        port: 993,
        tls: true
      },
    };

    it('should create a new user', async () => {
      mockUserModel.create.mockResolvedValue(mockUser);

      const result = await service.create(createUserDto);
      expect(result).toEqual(mockUser);
      expect(mockUserModel.create).toHaveBeenCalled();
    });

    it('should throw ConflictException if email already exists', async () => {
      mockUserModel.findOne.mockResolvedValue(mockUser);

      await expect(service.create(createUserDto))
        .rejects
        .toThrow(new ConflictException('Email already registered'));
      
      expect(mockUserModel.create).not.toHaveBeenCalled();
    });

    it('should throw an error if encryption fails', async () => {
      mockUserModel.findOne.mockResolvedValue(null);
      mockConfigService.get.mockReturnValue(null);

      await expect(service.create(createUserDto))
        .rejects
        .toThrow(InternalServerErrorException);
      
      expect(mockUserModel.create).not.toHaveBeenCalled();
    });

    it('should throw an error if user creation fails', async () => {
      mockUserModel.findOne.mockResolvedValue(null);
      mockUserModel.create.mockRejectedValue(new Error('Database error'));

      await expect(service.create(createUserDto))
        .rejects
        .toThrow('Database error');
    });
  });

  describe('findAll', () => {
    it('should return an array of users', async () => {
      mockUserModel.find.mockResolvedValue([mockUser]);

      const result = await service.findAll();
      expect(result).toEqual([mockUser]);
      expect(mockUserModel.find).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a user by id', async () => {
      const userId = mockUser._id.toString();
      mockUserModel.findById.mockResolvedValue(mockUser);

      const result = await service.findOne(userId);
      expect(result).toEqual(mockUser);
      expect(mockUserModel.findById).toHaveBeenCalledWith(userId);
    });

    it('should return null if user not found', async () => {
      const userId = new Types.ObjectId().toString();
      mockUserModel.findById.mockResolvedValue(null);

      const result = await service.findOne(userId);
      expect(result).toBeNull();
      expect(mockUserModel.findById).toHaveBeenCalledWith(userId);
    });
  });

  describe('update', () => {
    it('should update a user', async () => {
      const userId = mockUser._id.toString();
      const updateUserDto: UpdateUserDto = {
        emailSettings: {
          host: 'new.imap.example.com',
          port: 993,
          tls: true
        }
      };

      const updatedUser = { ...mockUser, ...updateUserDto };
      mockUserModel.findByIdAndUpdate.mockResolvedValue(updatedUser);

      const result = await service.update(userId, updateUserDto);
      expect(result).toEqual(updatedUser);
      expect(mockUserModel.findByIdAndUpdate).toHaveBeenCalledWith(
        userId,
        updateUserDto,
        { new: true }
      );
    });
  });

  describe('remove', () => {
    it('should remove a user', async () => {
      const userId = mockUser._id.toString();
      mockUserModel.findByIdAndDelete.mockResolvedValue(mockUser);

      const result = await service.remove(userId);
      expect(result).toEqual(mockUser);
      expect(mockUserModel.findByIdAndDelete).toHaveBeenCalledWith(userId);
    });
  });

  describe('updateStatistics', () => {
    it('should update user statistics', async () => {
      const userId = mockUser._id.toString();
      const updatedUser = {
        ...mockUser,
        emailsProcessed: 1,
        matchedIntentions: 1,
        lastProcessedAt: new Date(),
      };

      mockUserModel.findByIdAndUpdate.mockResolvedValue(updatedUser);
      mockProcessedEmailModel.countDocuments.mockResolvedValue(1);

      const result = await service.updateStatistics(userId);
      expect(result).toEqual(updatedUser);
      expect(mockUserModel.findByIdAndUpdate).toHaveBeenCalled();
      expect(mockProcessedEmailModel.countDocuments).toHaveBeenCalled();
    });
  });
});
