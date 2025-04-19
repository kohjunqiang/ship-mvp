import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { PriceService } from '../../../src/admin/price.service';
import { Price } from '../../../src/schemas/price.entity';
import { createMockObjectId } from '../../utils/test.utils';

describe('PriceService', () => {
  let service: PriceService;
  let mockPriceModel: any;

  const mockPrice = {
    _id: createMockObjectId(),
    intention: createMockObjectId(),
    name: 'Basic Plan',
    amount: 99.99,
    currency: 'USD',
    description: 'Basic email processing plan',
    emailQuota: 100,
    additionalEmailPrice: 0.10,
    features: ['Basic AI Processing', 'Email Integration'],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    mockPriceModel = {
      create: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      findById: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      findByIdAndDelete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PriceService,
        {
          provide: getModelToken(Price.name),
          useValue: mockPriceModel,
        },
      ],
    }).compile();

    service = module.get<PriceService>(PriceService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new price plan', async () => {
      const createPriceDto = {
        intention: createMockObjectId(),
        name: 'Premium Plan',
        amount: 199.99,
        currency: 'USD',
        description: 'Premium email processing plan',
        emailQuota: 200,
        additionalEmailPrice: 0.08,
        features: ['Advanced AI Processing', 'Priority Support'],
      };

      mockPriceModel.create.mockResolvedValue({
        _id: createMockObjectId(),
        ...createPriceDto,
        isActive: true,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });

      const result = await service.create(createPriceDto);

      expect(result).toBeDefined();
      expect(result.name).toBe(createPriceDto.name);
      expect(result.amount).toBe(createPriceDto.amount);
      expect(mockPriceModel.create).toHaveBeenCalledWith(createPriceDto);
    });

    it('should handle creation errors', async () => {
      mockPriceModel.create.mockRejectedValue(new Error('Creation failed'));

      await expect(service.create({
        intention: createMockObjectId(),
        name: 'Test Plan',
        amount: 99.99,
        currency: 'USD',
        description: 'Test',
        emailQuota: 100,
        additionalEmailPrice: 0.1,
        features: [],
      }))
        .rejects
        .toThrow('Failed to create price plan');
    });
  });

  describe('findAll', () => {
    it('should return all price plans', async () => {
      mockPriceModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue([mockPrice]),
      });

      const result = await service.findAll();

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe(mockPrice.name);
      expect(mockPriceModel.find).toHaveBeenCalled();
    });

    it('should handle query errors', async () => {
      mockPriceModel.find.mockReturnValue({
        exec: jest.fn().mockRejectedValue(new Error('Query failed')),
      });

      await expect(service.findAll())
        .rejects
        .toThrow('Failed to fetch price plans');
    });
  });

  describe('findOne', () => {
    it('should return a specific price plan', async () => {
      mockPriceModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockPrice),
      });

      const result = await service.findOne(mockPrice._id.toString());

      expect(result).toBeDefined();
      expect(result.name).toBe(mockPrice.name);
      expect(mockPriceModel.findById).toHaveBeenCalledWith(mockPrice._id.toString());
    });

    it('should return null for non-existent price plan', async () => {
      mockPriceModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const result = await service.findOne(createMockObjectId().toString());

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update a price plan', async () => {
      const updateData = {
        amount: 149.99,
        additionalEmailPrice: 0.09,
        features: ['Updated Feature'],
      };

      mockPriceModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          ...mockPrice,
          ...updateData,
        }),
      });

      const result = await service.update(mockPrice._id.toString(), updateData);

      expect(result).toBeDefined();
      expect(result.amount).toBe(updateData.amount);
      expect(mockPriceModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockPrice._id.toString(),
        updateData,
        { new: true },
      );
    });

    it('should handle update errors', async () => {
      mockPriceModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockRejectedValue(new Error('Update failed')),
      });

      await expect(service.update(mockPrice._id.toString(), { amount: 199.99 }))
        .rejects
        .toThrow('Failed to update price plan');
    });
  });

  describe('remove', () => {
    it('should remove a price plan', async () => {
      mockPriceModel.findByIdAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockPrice),
      });

      const result = await service.remove(mockPrice._id.toString());

      expect(result).toBeDefined();
      expect(result.name).toBe(mockPrice.name);
      expect(mockPriceModel.findByIdAndDelete).toHaveBeenCalledWith(mockPrice._id.toString());
    });

    it('should handle deletion errors', async () => {
      mockPriceModel.findByIdAndDelete.mockReturnValue({
        exec: jest.fn().mockRejectedValue(new Error('Deletion failed')),
      });

      await expect(service.remove(mockPrice._id.toString()))
        .rejects
        .toThrow('Failed to remove price plan');
    });
  });

  describe('calculatePrice', () => {
    it('should calculate price for emails within quota', () => {
      const emailCount = 50;
      const result = service.calculatePrice(mockPrice, emailCount);

      expect(result).toBe(mockPrice.amount);
    });

    it('should calculate price for emails exceeding quota', () => {
      const emailCount = 150; // 50 emails over quota
      const expectedPrice = mockPrice.amount + (50 * mockPrice.additionalEmailPrice);
      const result = service.calculatePrice(mockPrice, emailCount);

      expect(result).toBe(expectedPrice);
    });

    it('should handle zero email count', () => {
      const result = service.calculatePrice(mockPrice, 0);

      expect(result).toBe(mockPrice.amount);
    });
  });
});
