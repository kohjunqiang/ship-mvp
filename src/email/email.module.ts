import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { ProcessedEmail, ProcessedEmailSchema } from '../schemas/processed-email.entity';
import { UserModule } from '../user/user.module';
import { AIModule } from '../ai/ai.module';
import { AdminModule } from '../admin/admin.module';
import { ActionModule } from '../action/action.module';
import { EmailController } from './email.controller';
import { EmailService } from './email.service';
import { EmailProcessorService } from './email-processor.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ProcessedEmail.name, schema: ProcessedEmailSchema },
    ]),
    ScheduleModule.forRoot(),
    UserModule,
    AIModule,
    AdminModule,
    ActionModule,
  ],
  controllers: [EmailController],
  providers: [EmailService, EmailProcessorService],
  exports: [EmailService, EmailProcessorService],
})
export class EmailModule {}
