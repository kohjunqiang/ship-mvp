import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import axios from 'axios';
import { Action, ActionDocument, ActionType } from '../schemas/action.entity';
import { CreateActionDto } from './dto/create-action.dto';
import { UpdateActionDto } from './dto/update-action.dto';

@Injectable()
export class ActionService {
  private readonly emailTransporter: nodemailer.Transporter;

  constructor(
    @InjectModel(Action.name) private actionModel: Model<ActionDocument>,
    private configService: ConfigService,
  ) {
    this.emailTransporter = nodemailer.createTransport({
      host: this.configService.get<string>('email.smtp.host'),
      port: this.configService.get<number>('email.smtp.port'),
      secure: this.configService.get<boolean>('email.smtp.secure'),
      auth: {
        user: this.configService.get<string>('email.smtp.user'),
        pass: this.configService.get<string>('email.smtp.password'),
      },
    });
  }

  async create(createActionDto: CreateActionDto): Promise<Action> {
    const createdAction = new this.actionModel({
      ...createActionDto,
      executionCount: 0,
      lastExecuted: null,
      lastStatus: null,
    });
    return createdAction.save();
  }

  async findAll(): Promise<Action[]> {
    return this.actionModel.find().exec();
  }

  async findOne(id: string): Promise<Action> {
    const action = await this.actionModel.findById(id).exec();
    if (!action) {
      throw new NotFoundException(`Action #${id} not found`);
    }
    return action;
  }

  async update(id: string, updateActionDto: UpdateActionDto): Promise<Action> {
    const action = await this.actionModel
      .findByIdAndUpdate(id, updateActionDto, { new: true })
      .exec();
    if (!action) {
      throw new NotFoundException(`Action #${id} not found`);
    }
    return action;
  }

  async remove(id: string): Promise<Action> {
    const action = await this.actionModel.findByIdAndDelete(id).exec();
    if (!action) {
      throw new NotFoundException(`Action #${id} not found`);
    }
    return action;
  }

  private replaceVariables(obj: any, context: Record<string, any>): any {
    if (typeof obj === 'string') {
      return obj.replace(/\{\{(.*?)\}\}/g, (match, key) => {
        const value = key.split('.').reduce((acc: Record<string, any> | undefined, part: string) => acc?.[part], context);
        return value !== undefined ? value : match;
      });
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.replaceVariables(item, context));
    }

    if (typeof obj === 'object' && obj !== null) {
      const result: Record<string, any> = {};
      for (const [key, value] of Object.entries(obj)) {
        result[key] = this.replaceVariables(value, context);
      }
      return result;
    }

    return obj;
  }

  async executeAction(actionId: string, context: Record<string, any>): Promise<any> {
    const action = await this.findOne(actionId);
    const config = this.replaceVariables(action.config, context);

    let result;
    let status = 'success';

    try {
      switch (action.type) {
        case ActionType.SEND_EMAIL:
          result = await this.executeSendEmail(config);
          break;
        case ActionType.API_CALL:
          result = await this.executeApiCall(config);
          break;
        case ActionType.UPDATE_RECORD:
          result = await this.executeUpdateRecord(config);
          break;
        case ActionType.NOTIFICATION:
          result = await this.executeNotification(config);
          break;
        case ActionType.CUSTOM:
          result = await this.executeCustomAction(config);
          break;
        default:
          throw new BadRequestException(`Unsupported action type: ${action.type}`);
      }
    } catch (error) {
      status = 'error';
      throw error;
    } finally {
      await this.actionModel.findByIdAndUpdate(actionId, {
        $inc: { executionCount: 1 },
        $set: {
          lastExecuted: new Date(),
          lastStatus: status,
        },
      });
    }

    return result;
  }

  async executeSendEmail(config: any): Promise<any> {
    const { to, subject, body, cc, bcc } = config;
    const info = await this.emailTransporter.sendMail({
      from: this.configService.get<string>('email.from'),
      to,
      cc,
      bcc,
      subject,
      html: body,
    });
    return info;
  }

  async executeApiCall(config: any): Promise<any> {
    const { url, method, headers, body } = config;
    const response = await axios({
      method: method.toLowerCase(),
      url,
      headers,
      data: body,
    });
    return response.data;
  }

  async executeUpdateRecord(config: any): Promise<any> {
    const { collection, identifier, data } = config;
    // This is a placeholder. Implement based on your database needs
    throw new Error('Update record action not implemented');
  }

  async executeNotification(config: any): Promise<any> {
    const { title, message, type, recipients } = config;
    // This is a placeholder. Implement based on your notification system
    throw new Error('Notification action not implemented');
  }

  async executeCustomAction(config: any): Promise<any> {
    // This is a placeholder. Implement based on your custom action needs
    throw new Error('Custom action not implemented');
  }
}
