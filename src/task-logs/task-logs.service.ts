import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateTaskLogDto,
  GetUserLogsDto,
} from '../task-logs/dto/task-logs.dto';
import { throwError } from '../helpers/throwError';
import { TaskLog, WorkStatus } from '@prisma/client';
import { getSecondsFromTime } from '../helpers/getSecondsFromDate';

@Injectable()
export class TaskLogsService {
  constructor(private readonly prisma: PrismaService) {}

  public async createTaskLog({
    dto,
    userId,
  }: {
    dto: CreateTaskLogDto;
    userId: string;
  }): Promise<any> {
    // Check if user member or owner
    const existingMember = await this.prisma.organizationMember.findUnique({
      where: { user: userId },
      include: { organization: true },
    });
    const existingOwner = await this.prisma.organization.findUnique({
      where: { id: dto.organizationId, ownerId: userId },
    });

    if (!existingMember && !existingOwner) {
      throw new BadRequestException('User is not a member of organization');
    }

    // Check if task exists
    const task = await this.prisma.organizationTask.findUnique({
      where: { id: dto.task },
    });
    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // Check if user is assigned to the task
    if (task.assignee !== userId) {
      throw new BadRequestException('User is not assigned to this task');
    }

    const start = new Date(dto.start);
    const end = new Date(dto.end);
    const dateTask = new Date(dto.date);

    // Check if start date is not bigger than end date
    if (start > end) {
      throw new BadRequestException('Start time cannot be after end time');
    }

    const taskCreatedDateOnly = new Date(task.createdAt);
    taskCreatedDateOnly.setHours(0, 0, 0, 0);

    const logDateOnly = new Date(dateTask);
    logDateOnly.setHours(0, 0, 0, 0);

    // Task log cannot be earlier than task creation date
    if (logDateOnly < taskCreatedDateOnly) {
      throw new BadRequestException(
        `Task log date cannot be earlier than task creation date (${task.createdAt.toLocaleDateString(
          'en-GB',
          {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          },
        )})`,
      );
    }

    const startSeconds = getSecondsFromTime(start);
    const endSeconds = getSecondsFromTime(end);

    // Check if time log is overlapping
    const overlappingLog = await this.prisma.taskLog.findFirst({
      where: {
        taskId: dto.task,
        assigneeId: userId,
        date: dateTask,
      },
    });

    if (overlappingLog) {
      const logStartSeconds = getSecondsFromTime(overlappingLog.start);
      const logEndSeconds = getSecondsFromTime(overlappingLog.end);

      const isOverlapping =
        (logStartSeconds <= startSeconds && logEndSeconds > startSeconds) ||
        (logStartSeconds < endSeconds && logEndSeconds >= endSeconds) ||
        (logStartSeconds >= startSeconds && logEndSeconds <= endSeconds);

      if (isOverlapping) {
        throw new BadRequestException(
          'There is already a log for this task within the selected time range',
        );
      }
    }

    const totalWorkSeconds =
      Math.floor((end.getTime() - start.getTime()) / 1000) -
      (dto.breakSec || 0);

    if (totalWorkSeconds <= 0) {
      throw new BadRequestException(
        'Worked time must be greater than 0 seconds',
      );
    }

    // Create log
    const newLog = await this.prisma.taskLog.create({
      data: {
        organizationId: dto.organizationId,
        taskId: dto.task,
        date: dateTask,
        type: dto.type,
        start,
        end,
        breakSec: dto.breakSec,
        note: dto.note,
        mood: dto.mood,
        assigneeId: userId,
      },
    });

    // Update task data
    await this.prisma.organizationTask.update({
      where: { id: dto.task },
      data: {
        loggedTimeSec: (task.loggedTimeSec || 0) + totalWorkSeconds,
        startedAt: !task.startedAt
          ? dateTask
          : dateTask < task.startedAt
            ? dateTask
            : task.startedAt,
        finishedAt: !task.finishedAt
          ? dateTask
          : dateTask > task.finishedAt
            ? dateTask
            : task.finishedAt,
        workStatus: WorkStatus.PUSHED,
      },
    });

    return {
      data: newLog,
      message: 'New task log is added!',
    };
  }
  catch(error) {
    throwError({
      error,
      customMessage: `Failed to add task log: ${error.message}`,
    });
  }

  public async getUserLogs({
    userId,
    limit,
    page,
  }: {
    userId: string;
  } & GetUserLogsDto) {
    const skip = (page - 1) * limit;

    const [logs, totalItems] = await Promise.all([
      this.prisma.taskLog.findMany({
        where: { assigneeId: userId },
        skip,
        take: limit,
        orderBy: {
          date: 'desc',
        },
        include: {
          task: {
            select: {
              id: true,
              title: true,
            },
          },
          organization: {
            select: {
              avatar: true,
              name: true,
              id: true,
            },
          },
        },
      }),
      this.prisma.taskLog.count({
        where: { assigneeId: userId },
      }),
    ]);

    return {
      data: { logs },
      pagination: {
        totalItems,
        currentPage: page,
        pageSize: limit,
        totalPages: Math.ceil(totalItems / limit),
      },
    };
  }

  public async updateTaskLog({
    logId,
    dto,
    userId,
  }: {
    logId: string;
    dto: Partial<CreateTaskLogDto>;
    userId: string;
  }): Promise<any> {
    try {
      // Check if log exists
      const existingLog = await this.prisma.taskLog.findUnique({
        where: { id: logId },
      });

      if (!existingLog) {
        throw new NotFoundException('Log not found');
      }

      // Check if user member or owner
      const existingMember = await this.prisma.organizationMember.findUnique({
        where: { user: userId },
      });

      const existingOwner = await this.prisma.organization.findUnique({
        where: { id: existingLog.organizationId, ownerId: userId },
      });

      if (!existingMember && !existingOwner) {
        throw new BadRequestException('User is not a member of organization');
      }

      // Check if task exists
      const task = await this.prisma.organizationTask.findUnique({
        where: { id: existingLog.taskId },
      });

      if (!task) {
        throw new NotFoundException('Task not found');
      }

      // Check if user is assigned to the task
      if (task.assignee !== userId) {
        throw new BadRequestException('User is not assigned to this task');
      }

      const {
        date: dateDto,
        start: startDto,
        end: endDto,
        breakSec: breakSecDto,
        organizationId,
        ...restDto
      } = dto;

      // Create payload object
      const updatePayload: Partial<TaskLog> = { ...restDto };

      // Validate date if added
      if (dateDto) {
        const dateTask = new Date(dateDto);

        const taskCreatedDateOnly = new Date(task.createdAt);
        taskCreatedDateOnly.setHours(0, 0, 0, 0);

        const logDateOnly = new Date(dateTask);
        logDateOnly.setHours(0, 0, 0, 0);

        // Task log cannot be earlier than task creation date
        if (logDateOnly < taskCreatedDateOnly) {
          throw new BadRequestException(
            `Task log date cannot be earlier than task creation date (${task.createdAt.toLocaleDateString(
              'en-GB',
              {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
              },
            )})`,
          );
        }

        updatePayload['date'] = dateTask;
      }

      // Validate log time if added
      if (startDto || endDto || breakSecDto) {
        const start = startDto ? new Date(startDto) : existingLog.start;
        const end = endDto ? new Date(endDto) : existingLog.end;
        const dateTask = dateDto ? new Date(dateDto) : existingLog.date;

        // Check if start is not after end
        if (start > end) {
          throw new BadRequestException('Start time cannot be after end time');
        }

        // Check if time log is overlapping
        const overlappingLog = await this.prisma.taskLog.findFirst({
          where: {
            taskId: task.id,
            assigneeId: userId,
            date: dateTask,
            NOT: { id: logId },
          },
        });

        if (overlappingLog) {
          const overlappingLogStartSeconds = getSecondsFromTime(
            overlappingLog.start,
          );
          const overlappingLogEndSeconds = getSecondsFromTime(
            overlappingLog.end,
          );

          const startSeconds = getSecondsFromTime(start);
          const endSeconds = getSecondsFromTime(end);

          const isOverlapping =
            (overlappingLogStartSeconds <= startSeconds &&
              overlappingLogEndSeconds > startSeconds) ||
            (overlappingLogStartSeconds < endSeconds &&
              overlappingLogEndSeconds >= endSeconds) ||
            (overlappingLogStartSeconds >= startSeconds &&
              overlappingLogEndSeconds <= endSeconds);

          if (isOverlapping) {
            throw new BadRequestException(
              'There is already a log for this task within the selected time range',
            );
          }
        }

        // Calculate total logged time
        const totalWorkSeconds =
          Math.floor((end.getTime() - start.getTime()) / 1000) -
          (breakSecDto || existingLog.breakSec || 0);

        if (totalWorkSeconds <= 0) {
          throw new BadRequestException(
            'Worked time must be greater than 0 seconds',
          );
        }

        // Add time values to payload
        startDto && (updatePayload['start'] = start);
        endDto && (updatePayload['end'] = end);
        breakSecDto && (updatePayload['breakSec'] = breakSecDto);

        // Calculate previous worked time for rollback
        const previousWorkSeconds =
          Math.floor(
            (existingLog.end.getTime() - existingLog.start.getTime()) / 1000,
          ) - (existingLog.breakSec || 0);

        // Update task data
        await this.prisma.organizationTask.update({
          where: { id: existingLog.taskId },
          data: {
            loggedTimeSec:
              (task.loggedTimeSec || 0) -
              previousWorkSeconds +
              totalWorkSeconds,
            startedAt: !task.startedAt
              ? dateTask
              : dateTask < task.startedAt
                ? dateTask
                : task.startedAt,
            finishedAt: !task.finishedAt
              ? dateTask
              : dateTask > task.finishedAt
                ? dateTask
                : task.finishedAt,
          },
        });
      }

      // Update task log
      const updatedLog = await this.prisma.taskLog.update({
        where: { id: logId },
        data: updatePayload,
      });

      return {
        data: updatedLog,
        message: 'Task log successfully updated!',
      };
    } catch (error) {
      throwError({
        error,
        customMessage: `Failed to update task log: ${error.message}`,
      });
    }
  }

  public async deleteTaskLog({
    logId,
    userId,
  }: {
    logId: string;
    userId: string;
  }): Promise<any> {
    try {
      // Check if log exists
      const existingLog = await this.prisma.taskLog.findUnique({
        where: { id: logId },
      });

      if (!existingLog) {
        throw new NotFoundException('Task log not found');
      }

      // Check if user is allowed to delete the log (member or owner of the organization)
      const existingMember = await this.prisma.organizationMember.findUnique({
        where: {
          user: userId,
          organizationId: existingLog.organizationId,
        },
      });

      const existingOwner = await this.prisma.organization.findUnique({
        where: {
          id: existingLog.organizationId,
          ownerId: userId,
        },
      });

      if (!existingMember && !existingOwner) {
        throw new BadRequestException(
          'User is not a member or owner of this organization',
        );
      }

      // Check if user is assigned to the task
      const task = await this.prisma.organizationTask.findUnique({
        where: { id: existingLog.taskId },
      });

      if (!task) {
        throw new NotFoundException('Task not found');
      }

      if (task.assignee !== userId && !existingOwner) {
        throw new BadRequestException(
          'User is not assigned to this task or does not have permission to delete this log',
        );
      }

      // Calculate worked time for rollback
      const workedSeconds =
        Math.floor(
          (existingLog.end.getTime() - existingLog.start.getTime()) / 1000,
        ) - (existingLog.breakSec || 0);

      // Update task data to rollback logged time
      await this.prisma.organizationTask.update({
        where: { id: task.id },
        data: {
          loggedTimeSec: (task.loggedTimeSec || 0) - workedSeconds,
        },
      });

      // Delete log
      await this.prisma.taskLog.delete({
        where: { id: logId },
      });

      return {
        message: 'Log successfully deleted',
      };
    } catch (error) {
      throwError({
        error,
        customMessage: `Failed to delete log: ${error.message}`,
      });
    }
  }
}
