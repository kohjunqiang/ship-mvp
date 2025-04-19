import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Price, PriceDocument } from '../schemas/price.entity';
import { CreatePriceDto } from './dto/create-price.dto';
import { UpdatePriceDto } from './dto/update-price.dto';

@Injectable()
export class PriceService {
  constructor(
    @InjectModel(Price.name)
    private priceModel: Model<PriceDocument>,
  ) {}

  async create(createPriceDto: CreatePriceDto): Promise<Price> {
    const createdPrice = new this.priceModel({
      ...createPriceDto,
      usageCount: 0,
    });
    return createdPrice.save();
  }

  async findAll(): Promise<Price[]> {
    return this.priceModel.find().populate('intention').exec();
  }

  async findByIntention(intentionId: string): Promise<Price[]> {
    return this.priceModel.find({ intention: intentionId }).exec();
  }

  async findOne(id: string): Promise<Price> {
    const price = await this.priceModel.findById(id).populate('intention').exec();
    if (!price) {
      throw new NotFoundException(`Price #${id} not found`);
    }
    return price;
  }

  async update(id: string, updatePriceDto: UpdatePriceDto): Promise<Price> {
    const price = await this.priceModel
      .findByIdAndUpdate(id, updatePriceDto, { new: true })
      .populate('intention')
      .exec();
    if (!price) {
      throw new NotFoundException(`Price #${id} not found`);
    }
    return price;
  }

  async remove(id: string): Promise<Price> {
    const price = await this.priceModel.findByIdAndDelete(id).exec();
    if (!price) {
      throw new NotFoundException(`Price #${id} not found`);
    }
    return price;
  }

  async incrementUsage(id: string): Promise<Price> {
    const price = await this.priceModel
      .findByIdAndUpdate(id, { $inc: { usageCount: 1 } }, { new: true })
      .exec();
    if (!price) {
      throw new NotFoundException(`Price #${id} not found`);
    }
    return price;
  }

  calculatePrice(price: Price, emailCount: number): number {
    if (emailCount <= price.emailQuota) {
      return price.amount;
    }
    
    const additionalEmails = emailCount - price.emailQuota;
    return price.amount + (additionalEmails * price.additionalEmailPrice);
  }
}
