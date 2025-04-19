import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from '../../../src/user/user.controller';
import { UserService } from '../../../src/user/user.service';
import { CreateUserDto } from '../../../src/user/dto/create-user.dto';
import { UpdateUserDto } from '../../../src/user/dto/update-user.dto';
import { createMockUser, createMockObjectId } from '../../utils/test.utils';
import { HttpStatus, NotFoundException, BadRequestException } from '@nestjs/common';

describe('UserController', () => {
  let controller: UserController;
  let service: UserService;

  const mockUser = createMockUser();

  const mockUserService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    findByEmail: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: mockUserService,
        },
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
    service = module.get<UserService>(UserService);

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new user and return 201', async () => {
      const createUserDto: CreateUserDto = {
        email: 'test@example.com',
        emailPassword: 'password123',
        emailSettings: {
          host: 'imap.gmail.com',
          port: 993,
          secure: true,
        },
      };

      mockUserService.create.mockResolvedValue(mockUser);

      const result = await controller.create(createUserDto);

      expect(result).toBeDefined();
      expect(result).toEqual(mockUser);
      expect(service.create).toHaveBeenCalledWith(createUserDto);
    });

    it('should throw BadRequestException for invalid email format', async () => {
      const invalidDto: CreateUserDto = {
        email: 'invalid-email',
        emailPassword: 'password123',
        emailSettings: {
          host: 'imap.gmail.com',
          port: 993,
          secure: true,
        },
      };

      await expect(controller.create(invalidDto))
        .rejects
        .toThrow(BadRequestException);
    });

    it('should throw BadRequestException for short password', async () => {
      const invalidDto: CreateUserDto = {
        email: 'test@example.com',
        emailPassword: 'short',
        emailSettings: {
          host: 'imap.gmail.com',
          port: 993,
          secure: true,
        },
      };

      await expect(controller.create(invalidDto))
        .rejects
        .toThrow(BadRequestException);
    });

    it('should handle service errors', async () => {
      const createUserDto: CreateUserDto = {
        email: 'test@example.com',
        emailPassword: 'password123',
        emailSettings: {
          host: 'imap.gmail.com',
          port: 993,
          secure: true,
        },
      };

      mockUserService.create.mockRejectedValue(new Error('Database error'));

      await expect(controller.create(createUserDto))
        .rejects
        .toThrow();
    });
  });

  describe('findAll', () => {
    it('should return an array of users with 200 status', async () => {
      const mockUsers = [mockUser];
      mockUserService.findAll.mockResolvedValue(mockUsers);

      const result = await controller.findAll();

      expect(result).toEqual(mockUsers);
      expect(service.findAll).toHaveBeenCalled();
    });

    it('should return empty array when no users exist', async () => {
      mockUserService.findAll.mockResolvedValue([]);

      const result = await controller.findAll();

      expect(result).toEqual([]);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a single user with 200 status', async () => {
      mockUserService.findOne.mockResolvedValue(mockUser);
      const mockId = createMockObjectId();

      const result = await controller.findOne(mockId.toString());

      expect(result).toEqual(mockUser);
      expect(service.findOne).toHaveBeenCalledWith(mockId.toString());
    });

    it('should throw BadRequestException for invalid ObjectId', async () => {
      await expect(controller.findOne('invalid-id'))
        .rejects
        .toThrow(BadRequestException);
    });

    it('should throw NotFoundException when user not found', async () => {
      const mockId = createMockObjectId();
      mockUserService.findOne.mockResolvedValue(null);

      await expect(controller.findOne(mockId.toString()))
        .rejects
        .toThrow(NotFoundException);
    });
  });

  describe('findByEmail', () => {
    it('should return a user by email with 200 status', async () => {
      mockUserService.findByEmail.mockResolvedValue(mockUser);
      const email = 'test@example.com';

      const result = await controller.findByEmail(email);

      expect(result).toEqual(mockUser);
      expect(service.findByEmail).toHaveBeenCalledWith(email);
    });

    it('should throw NotFoundException when user not found by email', async () => {
      const email = 'nonexistent@example.com';
      mockUserService.findByEmail.mockResolvedValue(null);

      await expect(controller.findByEmail(email))
        .rejects
        .toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a user and return 200 status', async () => {
      const updateUserDto: UpdateUserDto = {
        emailPassword: 'newpassword123',
        emailSettings: {
          host: 'imap.gmail.com',
          port: 993,
          secure: true,
        },
      };

      const updatedUser = { ...mockUser, emailPassword: 'new_encrypted_password' };
      mockUserService.update.mockResolvedValue(updatedUser);
      const mockId = createMockObjectId();

      const result = await controller.update(mockId.toString(), updateUserDto);

      expect(result).toEqual(updatedUser);
      expect(service.update).toHaveBeenCalledWith(mockId.toString(), updateUserDto);
    });

    it('should throw BadRequestException for invalid update data', async () => {
      const invalidDto: UpdateUserDto = {
        emailPassword: 'short',
      };

      const mockId = createMockObjectId();
      await expect(controller.update(mockId.toString(), invalidDto))
        .rejects
        .toThrow(BadRequestException);
    });

    it('should throw NotFoundException when updating non-existent user', async () => {
      const mockId = createMockObjectId();
      const updateUserDto: UpdateUserDto = {
        emailPassword: 'newpassword123',
      };

      mockUserService.update.mockResolvedValue(null);

      await expect(controller.update(mockId.toString(), updateUserDto))
        .rejects
        .toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove a user and return 200 status', async () => {
      mockUserService.remove.mockResolvedValue(mockUser);
      const mockId = createMockObjectId();

      const result = await controller.remove(mockId.toString());

      expect(result).toEqual(mockUser);
      expect(service.remove).toHaveBeenCalledWith(mockId.toString());
    });

    it('should throw NotFoundException when removing non-existent user', async () => {
      const mockId = createMockObjectId();
      mockUserService.remove.mockResolvedValue(null);

      await expect(controller.remove(mockId.toString()))
        .rejects
        .toThrow(NotFoundException);
    });
  });
});
