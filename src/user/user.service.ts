import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { User, UserDocument } from '../schemas/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private configService: ConfigService,
  ) {}

  private encrypt(text: string): string {
    const algorithm = this.configService.get<string>('encryption.algorithm') || 'aes-256-cbc';
    const secret = this.configService.get<string>('encryption.secret') || 'default-secret-key';
    const iv = crypto.randomBytes(16);
    const key = crypto.scryptSync(secret, 'salt', 32);
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
    return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
  }

  private decrypt(text: string): string {
    const algorithm = this.configService.get<string>('encryption.algorithm') || 'aes-256-cbc';
    const secret = this.configService.get<string>('encryption.secret') || 'default-secret-key';
    const [ivHex, encryptedHex] = text.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const encrypted = Buffer.from(encryptedHex, 'hex');
    const key = crypto.scryptSync(secret, 'salt', 32);
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]);
    return decrypted.toString();
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const existingUser = await this.userModel.findOne({ email: createUserDto.email });
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const encryptedPassword = this.encrypt(createUserDto.emailPassword);
    const createdUser = new this.userModel({
      ...createUserDto,
      emailPassword: encryptedPassword,
      emailsProcessed: 0,
      matchedIntentions: 0,
    });
    return createdUser.save();
  }

  async findAll(): Promise<User[]> {
    return this.userModel.find().exec();
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException(`User #${id} not found`);
    }
    return user;
  }

  async findByEmail(email: string): Promise<User> {
    const user = await this.userModel.findOne({ email }).exec();
    if (!user) {
      throw new NotFoundException(`User with email ${email} not found`);
    }
    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    if (updateUserDto.emailPassword) {
      updateUserDto.emailPassword = this.encrypt(updateUserDto.emailPassword);
    }
    const user = await this.userModel
      .findByIdAndUpdate(id, updateUserDto, { new: true })
      .exec();
    if (!user) {
      throw new NotFoundException(`User #${id} not found`);
    }
    return user;
  }

  async remove(id: string): Promise<User> {
    const user = await this.userModel.findByIdAndDelete(id).exec();
    if (!user) {
      throw new NotFoundException(`User #${id} not found`);
    }
    return user;
  }

  async getDecryptedEmailPassword(id: string): Promise<string> {
    const user = await this.findOne(id);
    return this.decrypt(user.emailPassword);
  }

  async updateStatistics(id: string, emailProcessed: boolean, intentionMatched: boolean): Promise<User> {
    const update: any = {};
    
    if (emailProcessed) {
      update.$inc = { emailsProcessed: 1 };
    }
    
    if (intentionMatched) {
      update.$inc = { ...update.$inc, matchedIntentions: 1 };
    }

    const user = await this.userModel
      .findByIdAndUpdate(id, update, { new: true })
      .exec();
    
    if (!user) {
      throw new NotFoundException(`User #${id} not found`);
    }
    
    return user;
  }
}