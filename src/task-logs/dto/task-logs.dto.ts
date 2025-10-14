import { LogMood, LogWorkPreference } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { PaginationParamsDto } from '../../interfaces/dto';

export class CreateTaskLogDto {
  @IsString({ message: 'Organization ID must be a string' })
  @IsNotEmpty({ message: 'Organization ID is required' })
  organizationId: string;

  @IsString({ message: 'Task ID must be a string' })
  @IsNotEmpty({ message: 'Task ID is required' })
  task: string;

  @IsDateString({}, { message: 'Date must be a valid ISO date string' })
  @IsNotEmpty({ message: 'Date is required' })
  date: string;

  @IsEnum(LogWorkPreference, {
    message: `Type must be one of: ${Object.values(LogWorkPreference).join(', ')}`,
  })
  @IsNotEmpty({ message: 'Type is required' })
  type: LogWorkPreference;

  @IsDateString({}, { message: 'Start time must be a valid ISO date string' })
  @IsNotEmpty({ message: 'Start time is required' })
  start: string;

  @IsDateString({}, { message: 'End time must be a valid ISO date string' })
  @IsNotEmpty({ message: 'End time is required' })
  end: string;

  @IsInt({ message: 'Break time must be an integer in seconds' })
  @IsOptional()
  breakSec?: number;

  @IsString({ message: 'Note must be a string' })
  @IsOptional()
  note?: string;

  @IsEnum(LogMood, {
    message: `Mood must be one of: ${Object.values(LogMood).join(', ')}`,
  })
  @IsNotEmpty({ message: 'Mood is required' })
  @IsOptional()
  mood?: LogMood;
}

export class GetUserLogsDto extends PaginationParamsDto {}
