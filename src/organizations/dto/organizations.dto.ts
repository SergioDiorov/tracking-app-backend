import { Position, Role, Type } from '@prisma/client';
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
  IsPositive
} from 'class-validator';

import { lettersAndSpacesRegex } from 'src/helpers/regex';
import { industry, IndustryType, organizationRole, OrganizationRoleType } from 'src/interfaces/organization';

export class CreateOrganizationDto {
  @IsString({ message: 'Name must be a string' })
  @IsNotEmpty({ message: 'Name is required' })
  @MaxLength(100, { message: 'Name is too long' })
  @Matches(lettersAndSpacesRegex, { message: 'Name must be only letters and spaces' })
  name: string;

  @IsString({ message: 'Industry must be a string' })
  @IsNotEmpty({ message: 'Industry is required' })
  @MaxLength(50, { message: 'Industry is too long' })
  @IsIn(industry, { message: `Industry must be one of the following: ${industry.join(', ')}` })
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
  @IsIn(Object.values(Position), { message: `Position must be one of the following: ${Object.values(Position).join(', ')}` })
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
  @IsIn(Object.values(Type), { message: `Type must be one of the following: ${Object.values(Type).join(', ')}` })
  type: Type;


  @IsInt({ message: 'Work experience in months must be an integer' })
  @IsPositive({ message: 'Work experience must be a positive number' })
  workExperienceMonth: number;

  @IsString({ message: 'Role must be a string' })
  @IsNotEmpty({ message: 'Role is required' })
  @IsIn(Object.values(Role), { message: `Role must be one of the following: ${Object.values(Role).join(', ')}` })
  role: Role;
}

export class GetOrganizationMembersDto {
  @IsOptional()
  @IsInt({ message: 'Limit must be an integer' })
  @IsPositive({ message: 'Limit must be a positive number' })
  @Transform(({ value }) => parseInt(value, 10))
  limit?: number;

  @IsOptional()
  @IsInt({ message: 'Page must be an integer' })
  @IsPositive({ message: 'Page must be a positive number' })
  @Transform(({ value }) => parseInt(value, 10))
  page?: number;
}