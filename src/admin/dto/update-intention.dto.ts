import { PartialType } from '@nestjs/swagger';
import { CreateIntentionDto } from './create-intention.dto';

export class UpdateIntentionDto extends PartialType(CreateIntentionDto) {}
