import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { UserService } from '../user/user.service';
import { EmailService } from './email.service';
import { AIService } from '../ai/ai.service';
import { IntentionService } from '../admin/intention.service';
import { PriceService } from '../admin/price.service';
import { ActionService } from '../action/action.service';
import { ProcessedEmail, ProcessedEmailDocument, ProcessingStatus } from '../schemas/processed-email.entity';
import { User, UserDocument } from '../schemas/user.entity';
import { Price, PriceDocument } from '../schemas/price.entity';
import { Intention, IntentionDocument } from '../schemas/intention.entity';
import { ConfigService } from '@nestjs/config';
import { MailParser } from 'mailparser';
import { UserService as UserService2 } from '../user/user.service';
import { asMongoObjectId } from '../../test/utils/test.utils';

interface PopulatedUser {
  _id: Types.ObjectId;
  email: string;
}

interface PopulatedProcessedEmail extends Omit<ProcessedEmailDocument, 'user'> {
  _id: Types.ObjectId;
  user: PopulatedUser;
}

@Injectable()
export class EmailProcessorService {
  private readonly logger = new Logger(EmailProcessorService.name);
  private isProcessing = false;

  constructor(
    @InjectModel(ProcessedEmail.name)
    private processedEmailModel: Model<ProcessedEmailDocument>,
    private userService: UserService,
    private emailService: EmailService,
    private aiService: AIService,
    private intentionService: IntentionService,
    private priceService: PriceService,
    private actionService: ActionService,
    private readonly configService: ConfigService,
    private readonly userService2: UserService2,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async fetchNewEmails() {
    this.logger.log('Starting email fetch for all users...');
    
    try {
      const users = await this.userService.findAll();
      
      for (const user of users) {
        if (user instanceof User) {
          await this.fetchEmailsForUser(user as UserDocument);
        }
      }
      
      this.logger.log('Email fetch completed successfully');
    } catch (error) {
      this.logger.error('Error fetching emails:', error);
    }
  }

  private async fetchEmailsForUser(user: UserDocument) {
    try {
      const typedUser = user as unknown as { _id: Types.ObjectId };
      const userId = typedUser._id.toString();
      const emails = await this.emailService.fetchEmails(userId);
      
      for (const email of emails) {
        const userObjectId = asMongoObjectId(userId);
        await this.emailService.saveProcessedEmail({
          user: userObjectId,
          subject: email.subject,
          content: email.text,
          sender: email.from,
          emailId: email.messageId,
          status: ProcessingStatus.PENDING,
          isProcessed: false,
          extractedData: {},
          aiResponse: {},
          executedActions: [],
          processingDuration: 0,
          attempts: 0,
          createdAt: email.date,
          isActive: true,
        });
      }

      await this.userService.updateStatistics(userId, true, false);
      
    } catch (error) {
      this.logger.error(`Error fetching emails for user ${(user as any).email}:`, error);
    }
  }

  @Cron(CronExpression.EVERY_30_SECONDS)
  async processEmails() {
    if (this.isProcessing) {
      this.logger.log('Email processing already in progress, skipping...');
      return;
    }

    this.isProcessing = true;
    this.logger.log('Starting email processing...');

    try {
      const pendingEmails = await this.processedEmailModel
        .find({ status: ProcessingStatus.PENDING, isActive: true })
        .populate<{ user: UserDocument }>('user')
        .exec();

      for (const email of pendingEmails) {
        const typedEmail = email as unknown as PopulatedProcessedEmail;
        if (typedEmail._id && typedEmail.user._id) {
          await this.processEmail(typedEmail);
        }
      }

      this.logger.log('Email processing completed successfully');
    } catch (error) {
      this.logger.error('Error processing emails:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  private async processEmail(email: PopulatedProcessedEmail): Promise<void> {
    try {
      // Step 1: Detect intention using AI
      const detectionResult = await this.aiService.detectIntention(
        email.subject,
        email.content,
      );

      // Step 2: Find matching admin-defined intention
      const intentions = await this.intentionService.findAll();
      const matchedIntention = intentions.find(intention =>
        intention.keywords.some(keyword =>
          detectionResult.detectedIntention.toLowerCase().includes(keyword.toLowerCase())
        )
      ) as IntentionDocument;

      if (!matchedIntention || !matchedIntention._id) {
        const emailId = email._id.toString();
        await this.emailService.markEmailAsProcessed(emailId, ProcessingStatus.NO_MATCH, {
          aiResult: detectionResult,
        });
        return;
      }

      // Step 3: Extract information based on intention's requirements
      const extractedInfo = await this.aiService.extractInformation(
        email.subject,
        email.content,
        matchedIntention.aiConfig?.extractFields || [],
      );

      // Step 4: Find applicable price rules
      const intentionId = matchedIntention._id.toString();
      const prices = await this.priceService.findByIntention(intentionId);
      const applicablePrice = prices.find(price => {
        // Implement price rule matching logic based on criteria
        return true; // Placeholder
      }) as PriceDocument;

      // Step 5: Execute associated actions
      const actionResults = [];
      for (const actionId of matchedIntention.actions) {
        try {
          const result = await this.actionService.executeAction(actionId.toString(), {
            email,
            intention: matchedIntention,
            extracted: extractedInfo,
            price: applicablePrice,
          });
          actionResults.push({ actionId: actionId.toString(), status: 'success', result });
        } catch (error) {
          actionResults.push({ actionId: actionId.toString(), status: 'error', error: error.message });
        }
      }

      // Step 6: Update email status and statistics
      const emailId = email._id.toString();
      const userObjectId = asMongoObjectId((email.user as PopulatedUser)._id);
      const intentionObjectId = asMongoObjectId(intentionId);
      const priceObjectId = applicablePrice && applicablePrice._id 
        ? asMongoObjectId((applicablePrice as unknown as { _id: Types.ObjectId })._id.toString()) 
        : undefined;

      await this.emailService.markEmailAsProcessed(emailId, ProcessingStatus.PROCESSED, {
        aiResult: detectionResult,
        matchedIntention: intentionObjectId,
        extractedInfo,
        applicablePrice: priceObjectId,
        actionResults,
      });

      await this.userService.updateStatistics(userObjectId.toString(), false, true);
      await this.intentionService.updateStatistics(
        intentionId,
        detectionResult.confidence,
      );

      if (applicablePrice && applicablePrice._id) {
        await this.priceService.incrementUsage(applicablePrice._id.toString());
      }
    } catch (error) {
      const emailId = email._id.toString();
      await this.emailService.markEmailAsProcessed(emailId, ProcessingStatus.ERROR, {
        error: error.message,
      });
      throw error;
    }
  }

  async manualProcess(emailId: string): Promise<void> {
    const email = await this.emailService.findProcessedEmailById(emailId);
    if (!email) {
      throw new NotFoundException(`Email with id ${emailId} not found`);
    }
    if (email.status === ProcessingStatus.PROCESSED) {
      throw new BadRequestException('Email is already processed');
    }
    const populatedEmail = email as unknown as PopulatedProcessedEmail;
    await this.processEmail(populatedEmail);
  }
}
