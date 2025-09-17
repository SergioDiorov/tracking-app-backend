import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
} from '@nestjs/common';
import { TaskLogsService } from './task-logs.service';
import { CreateTaskLogDto, GetUserLogsDto } from './dto/task-logs.dto';

@Controller('task-logs')
export class TaskLogsController {
  constructor(private readonly taskLogsService: TaskLogsService) {}

  // Add task log
  @Post('')
  async createTaskLog(
    @Body() dto: CreateTaskLogDto,
    @Request() req: any,
  ): Promise<any> {
    return this.taskLogsService.createTaskLog({
      dto,
      userId: req.user.sub,
    });
  }

  // Get user logs
  @Get('/:userId')
  getUserLogs(
    @Param('userId') userId: string,
    @Query() dto: GetUserLogsDto,
  ): Promise<any> {
    const limit = dto.limit ? Number(dto.limit) : 10;
    const page = dto.page ? Number(dto.page) : 1;

    return this.taskLogsService.getUserLogs({
      limit,
      page,
      userId,
    });
  }

  // Update task log
  @Patch('/:logId')
  async updateTaskLog(
    @Param('logId') logId: string,
    @Body() dto: Partial<CreateTaskLogDto>,
    @Request() req: any,
  ): Promise<any> {
    return this.taskLogsService.updateTaskLog({
      logId,
      dto,
      userId: req.user.sub,
    });
  }

  // Delete task log
  @Delete('/:logId')
  async deleteTaskLog(
    @Param('logId') logId: string,
    @Request() req: any,
  ): Promise<any> {
    return this.taskLogsService.deleteTaskLog({
      logId,
      userId: req.user.sub,
    });
  }
}
