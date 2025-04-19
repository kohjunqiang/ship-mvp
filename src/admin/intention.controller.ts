import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { IntentionService } from './intention.service';
import { CreateIntentionDto } from './dto/create-intention.dto';
import { UpdateIntentionDto } from './dto/update-intention.dto';
import { Intention } from '../schemas/intention.entity';

@ApiTags('admin/intentions')
@ApiBearerAuth()
@Controller('admin/intentions')
export class IntentionController {
  constructor(private readonly intentionService: IntentionService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new intention' })
  @ApiResponse({
    status: 201,
    description: 'The intention has been successfully created.',
    type: Intention,
  })
  create(@Body() createIntentionDto: CreateIntentionDto): Promise<Intention> {
    return this.intentionService.create(createIntentionDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all intentions' })
  @ApiResponse({
    status: 200,
    description: 'List of all intentions',
    type: [Intention],
  })
  findAll(): Promise<Intention[]> {
    return this.intentionService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an intention by id' })
  @ApiParam({ name: 'id', description: 'Intention ID' })
  @ApiResponse({
    status: 200,
    description: 'The found intention',
    type: Intention,
  })
  @ApiResponse({ status: 404, description: 'Intention not found' })
  findOne(@Param('id') id: string): Promise<Intention> {
    return this.intentionService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an intention' })
  @ApiParam({ name: 'id', description: 'Intention ID' })
  @ApiResponse({
    status: 200,
    description: 'The intention has been successfully updated.',
    type: Intention,
  })
  @ApiResponse({ status: 404, description: 'Intention not found' })
  update(
    @Param('id') id: string,
    @Body() updateIntentionDto: UpdateIntentionDto,
  ): Promise<Intention> {
    return this.intentionService.update(id, updateIntentionDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an intention' })
  @ApiParam({ name: 'id', description: 'Intention ID' })
  @ApiResponse({
    status: 204,
    description: 'The intention has been successfully deleted.',
  })
  @ApiResponse({ status: 404, description: 'Intention not found' })
  remove(@Param('id') id: string): Promise<Intention> {
    return this.intentionService.remove(id);
  }
}
