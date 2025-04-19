import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { EmailService } from './email.service';
import { EmailProcessorService } from './email-processor.service';
import { ProcessedEmail } from '../schemas/processed-email.entity';

@ApiTags('emails')
@ApiBearerAuth()
@Controller('emails')
export class EmailController {
  constructor(
    private readonly emailService: EmailService,
    private readonly emailProcessorService: EmailProcessorService,
  ) {}

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get processed emails for a user' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by status' })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'List of processed emails',
  })
  async findProcessedEmails(
    @Param('userId') userId: string,
    @Query('status') status?: string,
    @Query('skip', new ParseIntPipe({ optional: true })) skip = 0,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 10,
  ): Promise<{ total: number; emails: ProcessedEmail[] }> {
    return this.emailService.findProcessedEmails(userId, status, skip, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a processed email by id' })
  @ApiParam({ name: 'id', description: 'Email ID' })
  @ApiResponse({
    status: 200,
    description: 'The processed email',
    type: ProcessedEmail,
  })
  findOne(@Param('id') id: string): Promise<ProcessedEmail> {
    return this.emailService.findProcessedEmailById(id);
  }

  @Post('fetch/:userId')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Manually trigger email fetching for a user' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({
    status: 202,
    description: 'Email fetching has been triggered',
  })
  async triggerFetch(@Param('userId') userId: string): Promise<void> {
    const user = await this.emailService.userService.findOne(userId);
    await this.emailProcessorService.fetchEmailsForUser(user);
  }

  @Post('process/:id')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Manually trigger processing for an email' })
  @ApiParam({ name: 'id', description: 'Email ID' })
  @ApiResponse({
    status: 202,
    description: 'Email processing has been triggered',
  })
  triggerProcess(@Param('id') id: string): Promise<void> {
    return this.emailProcessorService.manualProcess(id);
  }
}
