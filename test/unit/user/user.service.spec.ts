import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserService } from '../../../src/user/user.service';
import { User, UserDocument } from '../../../src/schemas/user.entity';
import { CreateUserDto } from '../../../src/user/dto/create-user.dto';
import { UpdateUserDto } from '../../../src/user/dto/update-user.dto';
import { createMockUser, createMockObjectId, MockUser } from '../../utils/test.utils';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';
import { ConflictException, NotFoundException, InternalServerErrorException } from '@nestjs/common';

describe('UserService', () => {
  let service: UserService;
  let model: Model<UserDocument>;
  let configService: ConfigService;

  const mockUser = createMockUser({
    emailSettings: {
      host: 'imap.gmail.com',
      port: 993,
      secure: true,
    },
    emailPassword: 'encrypted:password',
  });

  const mockUserModel = {
    create: jest.fn(),
    find: jest.fn(),
    findById: jest.fn(),
    findOne: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
    exec: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      switch (key) {
        case 'encryption.algorithm':
          return 'aes-256-cbc';
        case 'encryption.secret':
          return 'this_is_a_32_byte_secret_key_12345';
        case 'encryption.iv':
          return Buffer.from('1234567890123456');
        default:
          return null;
      }
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
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    model = module.get<Model<UserDocument>>(getModelToken(User.name));
    configService = module.get<ConfigService>(ConfigService);
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
        host: 'imap.gmail.com',
        port: 993,
        secure: true,
      },
    };

    it('should create a user with encrypted password', async () => {
      mockUserModel.findOne.mockResolvedValue(null);
      mockUserModel.create.mockImplementation((data) => ({
        ...data,
        _id: createMockObjectId(),
      }));

      const result = await service.create(createUserDto);

      expect(result).toBeDefined();
      expect(result._id).toBeDefined();
      expect(result.email).toBe(createUserDto.email);
      expect(result.emailSettings).toEqual(createUserDto.emailSettings);
      expect(result.emailPassword).toMatch(/^encrypted:/);
      expect(result.emailPassword).not.toBe(createUserDto.emailPassword);
      expect(mockUserModel.create).toHaveBeenCalledTimes(1);
      expect(mockUserModel.findOne).toHaveBeenCalledWith({ email: createUserDto.email });
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
      const mockUsers = [mockUser, { ...mockUser, email: 'test2@example.com' }];
      mockUserModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUsers),
      });

      const result = await service.findAll();

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(2);
      expect(result[0].email).toBe(mockUser.email);
      expect(result[1].email).toBe('test2@example.com');
      expect(mockUserModel.find).toHaveBeenCalledTimes(1);
    });

    it('should return empty array if no users found', async () => {
      mockUserModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue([]),
      });

      const result = await service.findAll();

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(0);
    });
  });

  describe('findOne', () => {
    const mockId = createMockObjectId();

    it('should return a user if found', async () => {
      mockUserModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUser),
      });

      const result = await service.findOne(mockId.toString());

      expect(result).toBeDefined();
      expect(result.email).toBe(mockUser.email);
      expect(result.emailSettings).toEqual(mockUser.emailSettings);
      expect(mockUserModel.findById).toHaveBeenCalledWith(mockId.toString());
    });

    it('should throw NotFoundException if user not found', async () => {
      mockUserModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.findOne(mockId.toString()))
        .rejects
        .toThrow(new NotFoundException('User not found'));
      
      expect(mockUserModel.findById).toHaveBeenCalledWith(mockId.toString());
    });
  });

  describe('update', () => {
    const mockId = createMockObjectId();

    it('should update a user with new encrypted password', async () => {
      const updateUserDto: UpdateUserDto = {
        emailPassword: 'newpassword123',
        emailSettings: {
          host: 'imap.gmail.com',
          port: 993,
          secure: true,
        },
      };

      const updatedUser = {
        ...mockUser,
        emailPassword: 'encrypted:newpassword',
        emailSettings: updateUserDto.emailSettings,
      };

      mockUserModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(updatedUser),
      });

      const result = await service.update(mockId.toString(), updateUserDto);

      expect(result).toBeDefined();
      expect(result.emailPassword).toMatch(/^encrypted:/);
      expect(result.emailPassword).not.toBe(updateUserDto.emailPassword);
      expect(result.emailSettings).toEqual(updateUserDto.emailSettings);
      expect(mockUserModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockId.toString(),
        expect.objectContaining({
          emailSettings: updateUserDto.emailSettings,
        }),
        { new: true }
      );
    });

    it('should throw NotFoundException if user not found during update', async () => {
      const updateUserDto: UpdateUserDto = {
        emailPassword: 'newpassword123',
      };

      mockUserModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.update(mockId.toString(), updateUserDto))
        .rejects
        .toThrow(new NotFoundException('User not found'));
    });
  });

  describe('getDecryptedEmailPassword', () => {
    const mockId = createMockObjectId();

    it('should return decrypted email password', async () => {
      mockUserModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUser),
      });

      const result = await service.getDecryptedEmailPassword(mockId.toString());

      expect(result).toBeDefined();
      expect(result).not.toMatch(/^encrypted:/);
      expect(mockUserModel.findById).toHaveBeenCalledWith(mockId.toString());
    });

    it('should throw NotFoundException if user not found', async () => {
      mockUserModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.getDecryptedEmailPassword(mockId.toString()))
        .rejects
        .toThrow(new NotFoundException('User not found'));
    });

    it('should throw error if decryption fails', async () => {
      mockUserModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUser),
      });
      mockConfigService.get.mockReturnValue(null);

      await expect(service.getDecryptedEmailPassword(mockId.toString()))
        .rejects
        .toThrow(InternalServerErrorException);
    });
  });

  describe('updateStatistics', () => {
    const mockId = createMockObjectId();

    it('should update user statistics correctly', async () => {
      const updatedUser = {
        ...mockUser,
        emailsProcessed: 1,
        matchedIntentions: 1,
        lastProcessedAt: expect.any(Date),
      };

      mockUserModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(updatedUser),
      });

      const result = await service.updateStatistics(mockId.toString(), true, true);

      expect(result).toBeDefined();
      expect(result.emailsProcessed).toBe(1);
      expect(result.matchedIntentions).toBe(1);
      expect(result.lastProcessedAt).toBeDefined();
      expect(mockUserModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockId.toString(),
        {
          $inc: {
            emailsProcessed: 1,
            matchedIntentions: 1,
          },
          $set: {
            lastProcessedAt: expect.any(Date),
          },
        },
        { new: true }
      );
    });

    it('should throw NotFoundException if user not found during statistics update', async () => {
      mockUserModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.updateStatistics(mockId.toString(), true, true))
        .rejects
        .toThrow(new NotFoundException('User not found'));
    });
  });
});
