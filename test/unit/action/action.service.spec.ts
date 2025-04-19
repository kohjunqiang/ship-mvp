import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ActionService } from '../../../src/action/action.service';
import { Action, ActionType } from '../../../src/schemas/action.entity';
import { createMockObjectId } from '../../utils/test.utils';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { of, throwError } from 'rxjs';
import { Types } from 'mongoose';

describe('ActionService', () => {
  let service: ActionService;
  let mockActionModel: any;
  let mockHttpService: any;
  let mockConfigService: any;

  const mockAction = {
    _id: createMockObjectId(),
    name: 'Create Calendar Event',
    description: 'Creates a calendar event from email content',
    type: ActionType.API_CALL,
    order: 1,
    config: {
      url: 'https://api.calendar.com/events',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      bodyTemplate: {
        title: '{{topic}}',
        startTime: '{{date}}T{{time}}',
        description: '{{content}}',
      },
    },
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    mockActionModel = {
      create: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      findById: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      findByIdAndDelete: jest.fn(),
    };

    mockHttpService = {
      request: jest.fn(),
    };

    mockConfigService = {
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ActionService,
        {
          provide: getModelToken(Action.name),
          useValue: mockActionModel,
        },
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<ActionService>(ActionService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new action', async () => {
      const createActionDto = {
        name: 'Send Email',
        description: 'Sends an email response',
        type: ActionType.API_CALL,
        order: 1,
        config: {
          url: 'https://api.email.com/send',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          bodyTemplate: {
            to: '{{recipient}}',
            subject: '{{subject}}',
            body: '{{content}}',
          },
        },
      };

      mockActionModel.create.mockResolvedValue({
        _id: createMockObjectId(),
        ...createActionDto,
        isActive: true,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });

      const result = await service.create(createActionDto);

      expect(result).toBeDefined();
      expect(result.name).toBe(createActionDto.name);
      expect(mockActionModel.create).toHaveBeenCalledWith(createActionDto);
    });

    it('should handle creation errors', async () => {
      mockActionModel.create.mockRejectedValue(new Error('Creation failed'));

      await expect(service.create({
        name: 'Test Action',
        description: 'Test action description',
        type: ActionType.API_CALL,
        order: 1,
        config: {},
      }))
        .rejects
        .toThrow('Failed to create action');
    });
  });

  describe('findAll', () => {
    it('should return all actions', async () => {
      mockActionModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue([mockAction]),
      });

      const result = await service.findAll();

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe(mockAction.name);
      expect(mockActionModel.find).toHaveBeenCalled();
    });

    it('should handle query errors', async () => {
      mockActionModel.find.mockReturnValue({
        exec: jest.fn().mockRejectedValue(new Error('Query failed')),
      });

      await expect(service.findAll())
        .rejects
        .toThrow('Failed to fetch actions');
    });
  });

  describe('findOne', () => {
    it('should return a specific action', async () => {
      mockActionModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockAction),
      });

      const result = await service.findOne(mockAction._id.toString());

      expect(result).toBeDefined();
      expect(result.name).toBe(mockAction.name);
      expect(mockActionModel.findById).toHaveBeenCalledWith(mockAction._id.toString());
    });

    it('should return null for non-existent action', async () => {
      mockActionModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const result = await service.findOne(createMockObjectId().toString());

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update an action', async () => {
      const updateData = {
        description: 'Updated description',
        config: {
          ...mockAction.config,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer token',
          },
        },
      };

      mockActionModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          ...mockAction,
          ...updateData,
        }),
      });

      const result = await service.update(mockAction._id.toString(), updateData);

      expect(result).toBeDefined();
      expect(result.config.headers).toEqual(updateData.config.headers);
      expect(mockActionModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockAction._id.toString(),
        updateData,
        { new: true },
      );
    });

    it('should handle update errors', async () => {
      mockActionModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockRejectedValue(new Error('Update failed')),
      });

      await expect(service.update(mockAction._id.toString(), { description: 'test', config: {} }))
        .rejects
        .toThrow('Failed to update action');
    });
  });

  describe('remove', () => {
    it('should remove an action', async () => {
      mockActionModel.findByIdAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockAction),
      });

      const result = await service.remove(mockAction._id.toString());

      expect(result).toBeDefined();
      expect(result.name).toBe(mockAction.name);
      expect(mockActionModel.findByIdAndDelete).toHaveBeenCalledWith(mockAction._id.toString());
    });

    it('should handle deletion errors', async () => {
      mockActionModel.findByIdAndDelete.mockReturnValue({
        exec: jest.fn().mockRejectedValue(new Error('Deletion failed')),
      });

      await expect(service.remove(mockAction._id.toString()))
        .rejects
        .toThrow('Failed to remove action');
    });
  });

  describe('executeAction', () => {
    const extractedData = {
      topic: 'Project Meeting',
      date: '2025-04-20',
      time: '14:00',
      content: 'Discuss project progress',
    };

    it('should execute HTTP action successfully', async () => {
      mockActionModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockAction),
      });

      mockHttpService.request.mockReturnValue(
        of({
          status: 200,
          data: { success: true },
        }),
      );

      const result = await service.executeAction(mockAction._id.toString(), extractedData);

      expect(result.success).toBe(true);
      expect(mockHttpService.request).toHaveBeenCalledWith(
        expect.objectContaining({
          url: mockAction.config.url,
          method: mockAction.config.method,
          headers: mockAction.config.headers,
        }),
      );
    });

    it('should handle HTTP request errors', async () => {
      mockActionModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockAction),
      });

      mockHttpService.request.mockReturnValue(
        throwError(() => new Error('HTTP request failed')),
      );

      await expect(service.executeAction(mockAction._id.toString(), extractedData))
        .rejects
        .toThrow('Failed to execute action');
    });

    it('should handle invalid action type', async () => {
      const invalidAction = {
        ...mockAction,
        type: 'invalid_type' as ActionType,
      };

      mockActionModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(invalidAction),
      });

      await expect(service.executeAction(invalidAction._id.toString(), extractedData))
        .rejects
        .toThrow('Unsupported action type');
    });

    it('should handle missing required data', async () => {
      mockActionModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockAction),
      });

      const incompleteData = {
        topic: 'Project Meeting',
        // missing date and time
      };

      await expect(service.executeAction(mockAction._id.toString(), incompleteData))
        .rejects
        .toThrow('Missing required data');
    });
  });
});
