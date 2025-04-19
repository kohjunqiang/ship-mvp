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
import { PriceService } from './price.service';
import { CreatePriceDto } from './dto/create-price.dto';
import { UpdatePriceDto } from './dto/update-price.dto';
import { Price } from '../schemas/price.entity';

@ApiTags('admin/prices')
@ApiBearerAuth()
@Controller('admin/prices')
export class PriceController {
  constructor(private readonly priceService: PriceService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new price' })
  @ApiResponse({
    status: 201,
    description: 'The price has been successfully created.',
    type: Price,
  })
  create(@Body() createPriceDto: CreatePriceDto): Promise<Price> {
    return this.priceService.create(createPriceDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all prices' })
  @ApiResponse({
    status: 200,
    description: 'List of all prices',
    type: [Price],
  })
  findAll(): Promise<Price[]> {
    return this.priceService.findAll();
  }

  @Get('intention/:intentionId')
  @ApiOperation({ summary: 'Get prices by intention' })
  @ApiParam({ name: 'intentionId', description: 'Intention ID' })
  @ApiResponse({
    status: 200,
    description: 'List of prices for the intention',
    type: [Price],
  })
  findByIntention(@Param('intentionId') intentionId: string): Promise<Price[]> {
    return this.priceService.findByIntention(intentionId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a price by id' })
  @ApiParam({ name: 'id', description: 'Price ID' })
  @ApiResponse({
    status: 200,
    description: 'The found price',
    type: Price,
  })
  @ApiResponse({ status: 404, description: 'Price not found' })
  findOne(@Param('id') id: string): Promise<Price> {
    return this.priceService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a price' })
  @ApiParam({ name: 'id', description: 'Price ID' })
  @ApiResponse({
    status: 200,
    description: 'The price has been successfully updated.',
    type: Price,
  })
  @ApiResponse({ status: 404, description: 'Price not found' })
  update(
    @Param('id') id: string,
    @Body() updatePriceDto: UpdatePriceDto,
  ): Promise<Price> {
    return this.priceService.update(id, updatePriceDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a price' })
  @ApiParam({ name: 'id', description: 'Price ID' })
  @ApiResponse({
    status: 204,
    description: 'The price has been successfully deleted.',
  })
  @ApiResponse({ status: 404, description: 'Price not found' })
  remove(@Param('id') id: string): Promise<Price> {
    return this.priceService.remove(id);
  }
}
