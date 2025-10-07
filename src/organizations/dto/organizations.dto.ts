import { Optional } from '@nestjs/common';
import { Position, Priority, Role, Type, WorkStatus } from '@prisma/client';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  IsOptional,
  IsUrl,
  Matches,
  IsIn,
  IsInt,
  IsPositive,
  IsEnum,
  IsDateString,
} from 'class-validator';

import { lettersAndSpacesRegex } from 'src/helpers/regex';
import { PaginationParamsDto } from 'src/interfaces/dto';
import { industry, IndustryType } from 'src/interfaces/organization';

export class CreateOrganizationDto {
  @IsString({ message: 'Name must be a string' })
  @IsNotEmpty({ message: 'Name is required' })
  @MaxLength(100, { message: 'Name is too long' })
  @Matches(lettersAndSpacesRegex, {
    message: 'Name must be only letters and spaces',
  })
  name: string;

  @IsString({ message: 'Industry must be a string' })
  @IsNotEmpty({ message: 'Industry is required' })
  @MaxLength(50, { message: 'Industry is too long' })
  @IsIn(industry, {
    message: `Industry must be one of the following: ${industry.join(', ')}`,
  })
  industry: IndustryType;

  @IsString({ message: 'Registration country must be a string' })
  @IsNotEmpty({ message: 'Registration country is required' })
  @MaxLength(100, { message: 'Registration country is too long' })
  registrationCountry: string;

  @IsUrl({}, { message: 'Website must be a valid URL' })
  website: string;

  @IsEmail({}, { message: 'Corporate email must be a valid email address' })
  corporateEmail: string;

  @IsString({ message: 'Avatar image picker must be a string' })
  @IsOptional()
  avatar?: string;

  @IsString({ message: 'Description must be a string' })
  @IsOptional()
  @MaxLength(500, { message: 'Description is too long' })
  description?: string;
}

export class AddUserToOrganizationDto {
  @IsString({ message: 'Email must be a string' })
  @IsNotEmpty({ message: 'Email is required' })
  @IsEmail({}, { message: 'Email must be a valid email address' })
  email: string;

  @IsString({ message: 'Position must be a string' })
  @IsNotEmpty({ message: 'Position is required' })
  @IsIn(Object.values(Position), {
    message: `Position must be one of the following: ${Object.values(Position).join(', ')}`,
  })
  position: Position;

  @IsString({ message: 'Work schedule must be a string' })
  @IsNotEmpty({ message: 'Work schedule is required' })
  workSchedule: string;

  @IsInt({ message: 'Work hours must be an integer' })
  @IsPositive({ message: 'Work hours must be a positive number' })
  workHours: number;

  @IsInt({ message: 'Salary must be an integer' })
  @IsPositive({ message: 'Salary must be a positive number' })
  salary: number;

  @IsString({ message: 'Type must be a string' })
  @IsNotEmpty({ message: 'Type is required' })
  @IsIn(Object.values(Type), {
    message: `Type must be one of the following: ${Object.values(Type).join(', ')}`,
  })
  type: Type;

  @IsInt({ message: 'Work experience in months must be an integer' })
  @IsPositive({ message: 'Work experience must be a positive number' })
  workExperienceMonth: number;

  @IsString({ message: 'Role must be a string' })
  @IsNotEmpty({ message: 'Role is required' })
  @IsIn(Object.values(Role), {
    message: `Role must be one of the following: ${Object.values(Role).join(', ')}`,
  })
  role: Role;
}

export class UpdateUserFromOrganizationDto {
  @Optional()
  @IsString({ message: 'Email must be a string' })
  @IsEmail({}, { message: 'Email must be a valid email address' })
  email?: string;

  @Optional()
  @IsString({ message: 'Position must be a string' })
  @IsIn(Object.values(Position), {
    message: `Position must be one of the following: ${Object.values(Position).join(', ')}`,
  })
  position?: Position;

  @Optional()
  @IsString({ message: 'Work schedule must be a string' })
  workSchedule?: string;

  @Optional()
  @IsInt({ message: 'Work hours must be an integer' })
  @IsPositive({ message: 'Work hours must be a positive number' })
  workHours?: number;

  @Optional()
  @IsInt({ message: 'Salary must be an integer' })
  @IsPositive({ message: 'Salary must be a positive number' })
  salary?: number;

  @Optional()
  @IsString({ message: 'Type must be a string' })
  @IsIn(Object.values(Type), {
    message: `Type must be one of the following: ${Object.values(Type).join(', ')}`,
  })
  type?: Type;

  @Optional()
  @IsInt({ message: 'Work experience in months must be an integer' })
  @IsPositive({ message: 'Work experience must be a positive number' })
  workExperienceMonth?: number;

  @Optional()
  @IsString({ message: 'Role must be a string' })
  @IsIn(Object.values(Role), {
    message: `Role must be one of the following: ${Object.values(Role).join(', ')}`,
  })
  role?: Role;
}

export class GetOrganizationMembersDto extends PaginationParamsDto {
  @IsOptional()
  @IsString({ message: 'Search must be a string' })
  @MaxLength(50, { message: 'Search must be at most 50 characters' })
  search?: string;

  @IsOptional()
  @IsString({ message: 'Member ID must be a string' })
  userId?: string;

  @IsOptional()
  @IsIn(
    [
      'joined',
      'position',
      'workHours',
      'salary',
      'type',
      'workExperienceMonth',
      'role',
      'firstName',
      'age',
      'country',
      'workSchedule',
    ],
    {
      message:
        'SortBy must be one of: title, assignee, priority, deadline, createdAt',
    },
  )
  sortBy?:
    | 'joined'
    | 'position'
    | 'workHours'
    | 'salary'
    | 'type'
    | 'workExperienceMonth'
    | 'role'
    | 'firstName'
    | 'age'
    | 'country'
    | 'workSchedule';

  @IsOptional()
  @IsIn(['asc', 'desc'], {
    message: 'Sort order must be either "asc" or "desc"',
  })
  @Transform(({ value }) => value?.toLowerCase())
  sortOrder?: 'asc' | 'desc';
}

export class CreateOrganizationTaskDto {
  @IsString({ message: 'Title must be a string' })
  @IsNotEmpty({ message: 'Title is required' })
  @MaxLength(100, { message: 'Title is too long' })
  title: string;

  @IsString({ message: 'Description must be a string' })
  @IsNotEmpty({ message: 'Description is required' })
  @MaxLength(1000, { message: 'Description is too long' })
  descriptopn: string;

  @IsString({ message: 'Assignee ID must be a string' })
  @IsNotEmpty({ message: 'Assignee ID is required' })
  assignee: string;

  @IsEnum(Priority, {
    message: `Priority must be one of the following: ${Object.values(Priority).join(', ')}`,
  })
  @IsNotEmpty({ message: 'Priority is required' })
  priority: Priority;

  @IsDateString({}, { message: 'Deadline must be a valid ISO date string' })
  @IsNotEmpty({ message: 'Deadline is required' })
  deadline: Date;
}

export class UpdateOrganizationTaskDto {
  @IsString({ message: 'Title must be a string' })
  @MaxLength(100, { message: 'Title is too long' })
  @Optional()
  title?: string;

  @Optional()
  @IsString({ message: 'Description must be a string' })
  @MaxLength(1000, { message: 'Description is too long' })
  descriptopn?: string;

  @Optional()
  @IsString({ message: 'Assignee ID must be a string' })
  assignee?: string;

  @Optional()
  @IsEnum(Priority, {
    message: `Priority must be one of the following: ${Object.values(Priority).join(', ')}`,
  })
  priority?: Priority;

  @Optional()
  @IsDateString({}, { message: 'Deadline must be a valid ISO date string' })
  deadline?: Date;
}

export class GetOrganizationTasksDto extends PaginationParamsDto {
  @IsOptional()
  @IsIn(['title', 'assignee', 'priority', 'deadline', 'createdAt'], {
    message:
      'SortBy must be one of: title, assignee, priority, deadline, createdAt',
  })
  sortBy?: 'title' | 'assignee' | 'priority' | 'deadline' | 'createdAt';

  @IsOptional()
  @IsIn(['asc', 'desc'], {
    message: 'Sort order must be either "asc" or "desc"',
  })
  @Transform(({ value }) => value?.toLowerCase())
  sortOrder?: 'asc' | 'desc';

  @IsOptional()
  @IsString({ message: 'Member ID must be a string' })
  userId?: string;

  @IsOptional()
  @IsEnum(WorkStatus, {
    message: `Work status must be one of the following: ${Object.values(WorkStatus).join(', ')}`,
  })
  filterByWorkStatus?: WorkStatus;
}

export class GetOrganizationTasksProgress {
  @IsDateString({}, { message: 'Start Date must be a valid ISO date string' })
  @IsNotEmpty({ message: 'Start Date is required' })
  startDate?: string;

  @IsDateString({}, { message: 'End Date must be a valid ISO date string' })
  @IsNotEmpty({ message: 'End Date is required' })
  endDate?: string;

  @IsOptional()
  @IsString({ message: 'Member ID must be a string' })
  userId?: string;
}

export class GetOrganizationTasksAnalytics {
  @IsOptional()
  @IsString({ message: 'Member ID must be a string' })
  userToSearch?: string;
}
