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
import { ActionService } from './action.service';
import { CreateActionDto } from './dto/create-action.dto';
import { UpdateActionDto } from './dto/update-action.dto';
import { Action } from '../schemas/action.entity';

@ApiTags('actions')
@ApiBearerAuth()
@Controller('actions')
export class ActionController {
  constructor(private readonly actionService: ActionService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new action' })
  @ApiResponse({
    status: 201,
    description: 'The action has been successfully created.',
    type: Action,
  })
  create(@Body() createActionDto: CreateActionDto): Promise<Action> {
    return this.actionService.create(createActionDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all actions' })
  @ApiResponse({
    status: 200,
    description: 'List of all actions',
    type: [Action],
  })
  findAll(): Promise<Action[]> {
    return this.actionService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an action by id' })
  @ApiParam({ name: 'id', description: 'Action ID' })
  @ApiResponse({
    status: 200,
    description: 'The found action',
    type: Action,
  })
  @ApiResponse({ status: 404, description: 'Action not found' })
  findOne(@Param('id') id: string): Promise<Action> {
    return this.actionService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an action' })
  @ApiParam({ name: 'id', description: 'Action ID' })
  @ApiResponse({
    status: 200,
    description: 'The action has been successfully updated.',
    type: Action,
  })
  @ApiResponse({ status: 404, description: 'Action not found' })
  update(
    @Param('id') id: string,
    @Body() updateActionDto: UpdateActionDto,
  ): Promise<Action> {
    return this.actionService.update(id, updateActionDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an action' })
  @ApiParam({ name: 'id', description: 'Action ID' })
  @ApiResponse({
    status: 204,
    description: 'The action has been successfully deleted.',
  })
  @ApiResponse({ status: 404, description: 'Action not found' })
  remove(@Param('id') id: string): Promise<Action> {
    return this.actionService.remove(id);
  }

  @Post(':id/execute')
  @ApiOperation({ summary: 'Execute an action' })
  @ApiParam({ name: 'id', description: 'Action ID' })
  @ApiResponse({
    status: 200,
    description: 'The action has been successfully executed.',
  })
  @ApiResponse({ status: 404, description: 'Action not found' })
  execute(
    @Param('id') id: string,
    @Body() context: Record<string, any>,
  ): Promise<any> {
    return this.actionService.executeAction(id, context);
  }
}
