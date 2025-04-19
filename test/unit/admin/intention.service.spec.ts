import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IntentionService } from '../../../src/admin/intention.service';
import { Intention, IntentionDocument } from '../../../src/schemas/intention.entity';
import { createMockIntention, createMockObjectId } from '../../utils/test.utils';
import { Types } from 'mongoose';
import { NotFoundException } from '@nestjs/common';

describe('IntentionService', () => {
  let service: IntentionService;
  let intentionModel: Model<IntentionDocument>;

  const mockIntention = createMockIntention();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IntentionService,
        {
          provide: getModelToken(Intention.name),
          useValue: {
            create: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            findById: jest.fn(),
            findByIdAndUpdate: jest.fn(),
            findByIdAndDelete: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<IntentionService>(IntentionService);
    intentionModel = module.get<Model<IntentionDocument>>(getModelToken(Intention.name));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all active intentions', async () => {
      const mockIntentions = [mockIntention];
      jest.spyOn(intentionModel, 'find').mockResolvedValue(mockIntentions as IntentionDocument[]);

      const result = await service.findAll();

      expect(result).toEqual(mockIntentions);
      expect(intentionModel.find).toHaveBeenCalledWith({ isActive: true });
    });
  });

  describe('findOne', () => {
    it('should return a single intention', async () => {
      jest.spyOn(intentionModel, 'findById').mockResolvedValue(mockIntention as IntentionDocument);

      const result = await service.findOne(mockIntention._id.toString());

      expect(result).toEqual(mockIntention);
      expect(intentionModel.findById).toHaveBeenCalledWith(mockIntention._id.toString());
    });

    it('should throw NotFoundException if intention not found', async () => {
      jest.spyOn(intentionModel, 'findById').mockResolvedValue(null);

      await expect(service.findOne(mockIntention._id.toString())).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update an intention', async () => {
      const updateIntentionDto = {
        name: 'Updated Name',
      };

      const updatedIntention = {
        ...mockIntention,
        ...updateIntentionDto,
      };

      jest.spyOn(intentionModel, 'findByIdAndUpdate').mockResolvedValue(updatedIntention as IntentionDocument);

      const result = await service.update(mockIntention._id.toString(), updateIntentionDto);

      expect(result).toEqual(updatedIntention);
      expect(intentionModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockIntention._id.toString(),
        updateIntentionDto,
        { new: true },
      );
    });

    it('should throw NotFoundException if intention not found', async () => {
      jest.spyOn(intentionModel, 'findByIdAndUpdate').mockResolvedValue(null);

      await expect(service.update(mockIntention._id.toString(), {})).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove an intention', async () => {
      jest.spyOn(intentionModel, 'findByIdAndDelete').mockResolvedValue(mockIntention as IntentionDocument);

      const result = await service.remove(mockIntention._id.toString());

      expect(result).toEqual(mockIntention);
      expect(intentionModel.findByIdAndDelete).toHaveBeenCalledWith(mockIntention._id.toString());
    });

    it('should throw NotFoundException if intention not found', async () => {
      jest.spyOn(intentionModel, 'findByIdAndDelete').mockResolvedValue(null);

      await expect(service.remove(mockIntention._id.toString())).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateStatistics', () => {
    it('should update intention statistics', async () => {
      const confidence = 0.9;
      const updatedIntention = {
        ...mockIntention,
        matchCount: mockIntention.matchCount + 1,
        averageConfidence: (mockIntention.averageConfidence * mockIntention.matchCount + confidence) / (mockIntention.matchCount + 1),
      };

      jest.spyOn(intentionModel, 'findById').mockResolvedValue(mockIntention as IntentionDocument);
      jest.spyOn(intentionModel, 'findByIdAndUpdate').mockResolvedValue(updatedIntention as IntentionDocument);

      const result = await service.updateStatistics(mockIntention._id.toString(), confidence);

      expect(result).toEqual(updatedIntention);
      expect(intentionModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockIntention._id.toString(),
        {
          $inc: { matchCount: 1 },
          $set: { averageConfidence: updatedIntention.averageConfidence },
        },
        { new: true },
      );
    });

    it('should throw NotFoundException if intention not found', async () => {
      jest.spyOn(intentionModel, 'findById').mockResolvedValue(null);

      await expect(service.updateStatistics(mockIntention._id.toString(), 0.9)).rejects.toThrow(NotFoundException);
    });
  });
});
