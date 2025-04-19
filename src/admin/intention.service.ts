import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Intention, IntentionDocument } from '../schemas/intention.entity';
import { CreateIntentionDto } from './dto/create-intention.dto';
import { UpdateIntentionDto } from './dto/update-intention.dto';

@Injectable()
export class IntentionService {
  constructor(
    @InjectModel(Intention.name)
    private intentionModel: Model<IntentionDocument>,
  ) {}

  async create(createIntentionDto: CreateIntentionDto): Promise<IntentionDocument> {
    const createdIntention = new this.intentionModel({
      ...createIntentionDto,
      matchCount: 0,
      averageConfidence: 0,
      isActive: true,
    });
    return createdIntention.save();
  }

  async findAll(): Promise<IntentionDocument[]> {
    return this.intentionModel.find({ isActive: true }).exec();
  }

  async findOne(id: string): Promise<IntentionDocument> {
    const intention = await this.intentionModel.findById(id).exec();
    if (!intention) {
      throw new NotFoundException(`Intention #${id} not found`);
    }
    return intention;
  }

  async findById(id: string): Promise<IntentionDocument> {
    const intention = await this.intentionModel.findById(id).exec();
    if (!intention) {
      throw new NotFoundException(`Intention #${id} not found`);
    }
    return intention;
  }

  async update(id: string, updateIntentionDto: UpdateIntentionDto): Promise<IntentionDocument> {
    const intention = await this.intentionModel
      .findByIdAndUpdate(id, updateIntentionDto, { new: true })
      .exec();
    if (!intention) {
      throw new NotFoundException(`Intention #${id} not found`);
    }
    return intention;
  }

  async remove(id: string): Promise<IntentionDocument> {
    const intention = await this.intentionModel.findByIdAndDelete(id).exec();
    if (!intention) {
      throw new NotFoundException(`Intention #${id} not found`);
    }
    return intention;
  }

  async updateStatistics(id: string, confidence: number): Promise<IntentionDocument> {
    const intention = await this.intentionModel.findById(id).exec();
    if (!intention) {
      throw new NotFoundException(`Intention #${id} not found`);
    }

    const newMatchCount = intention.matchCount + 1;
    const newAverageConfidence =
      (intention.averageConfidence * intention.matchCount + confidence) / newMatchCount;

    const updatedIntention = await this.intentionModel
      .findByIdAndUpdate(
        id,
        {
          $inc: { matchCount: 1 },
          $set: { averageConfidence: newAverageConfidence },
        },
        { new: true },
      )
      .exec();
    
    if (!updatedIntention) {
      throw new NotFoundException(`Intention #${id} not found`);
    }

    return updatedIntention;
  }
}
