import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Intention, IntentionSchema } from '../schemas/intention.entity';
import { Price, PriceSchema } from '../schemas/price.entity';
import { IntentionController } from './intention.controller';
import { PriceController } from './price.controller';
import { IntentionService } from './intention.service';
import { PriceService } from './price.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Intention.name, schema: IntentionSchema },
      { name: Price.name, schema: PriceSchema },
    ]),
  ],
  controllers: [IntentionController, PriceController],
  providers: [IntentionService, PriceService],
  exports: [IntentionService, PriceService],
})
export class AdminModule {}
