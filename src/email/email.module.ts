// src/email/email.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EmailController } from './email.controller';
import { EmailService } from './email.service';
import { EmailStubService } from './email-stub.service';
import { ProcessedEmail, ProcessedEmailSchema, ProcessedEmailDocument } from '../schemas/processed-email.entity';
import { UserModule } from '../user/user.module';
import { EmailProcessorService } from './email-processor.service';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserService } from '../user/user.service';
import { AIModule } from '../ai/ai.module';
import { AdminModule } from '../admin/admin.module';
import { ActionModule } from '../action/action.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ProcessedEmail.name, schema: ProcessedEmailSchema },
    ]),
    UserModule,
    ConfigModule,
    AIModule,
    AdminModule,
    ActionModule,
  ],
  controllers: [EmailController],
  providers: [
    EmailProcessorService,
    {
      provide: EmailService,
      useFactory: (configService: ConfigService, processedEmailModel: Model<ProcessedEmail>, userService: UserService) => {
        if (configService.get('email.stub')) {
          return new EmailStubService();
        } else {
          // Cast the model to the correct type expected by EmailService
          const typedModel = processedEmailModel as unknown as Model<ProcessedEmailDocument>;
          return new EmailService(typedModel, userService);
        }
      },
      inject: [ConfigService, getModelToken(ProcessedEmail.name), UserService],
    }
  ],
  exports: [EmailService, EmailProcessorService],
})
export class EmailModule {}