import { IsEmail, IsNotEmpty, IsString, MinLength, MaxLength, Matches, IsOptional } from "class-validator";

import { lettersAndSpacesRegex } from "src/helpers/regex";

export class AuthSignUpDto {
  @IsEmail({}, { message: 'Email is required and must be a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  @MaxLength(64, { message: 'Email is too long' })
  email: string;

  @IsString({ message: 'Password must be a string' })
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(64, { message: 'Password is too long' })
  password: string;

  @IsString({ message: 'Confirm password must be a string' })
  @IsNotEmpty({ message: 'Confirm password is required' })
  @MinLength(8, { message: 'Confirm password must be at least 8 characters long' })
  @MaxLength(64, { message: 'Confirm password is too long' })
  confirmPassword: string;

  @IsString({ message: 'First name must be a string' })
  @IsNotEmpty({ message: 'First name is required' })
  @MaxLength(64, { message: 'First name is too long' })
  @Matches(lettersAndSpacesRegex, { message: 'Name must be only letters and spaces' })
  firstName: string;

  @IsString({ message: 'Last name must be a string' })
  @IsNotEmpty({ message: 'Last name is required' })
  @MaxLength(64, { message: 'Last name is too long' })
  @Matches(lettersAndSpacesRegex, { message: 'Name must be only letters and spaces' })
  lastName: string;

  @IsString({ message: 'Age must be a string' })
  @IsNotEmpty({ message: 'Age is required' })
  @Matches(/^[1-9][0-9]?$/, { message: 'Age must be a number between 18 and 70' })
  age: string;

  @IsString({ message: 'Country must be a string' })
  @IsNotEmpty({ message: 'Country is required' })
  @MaxLength(64, { message: 'Country name is too long' })
  country: string;

  @IsString({ message: 'City must be a string' })
  @IsNotEmpty({ message: 'City is required' })
  @MaxLength(64, { message: 'City name is too long' })
  city: string;

  @IsOptional()
  @IsString({ message: 'Avatar must be a string' })
  avatar?: string;

  @IsString({ message: 'Work preference must be a string' })
  @IsNotEmpty({ message: 'Work preference is required' })
  @MaxLength(64, { message: 'Work preference is too long' })
  workPreference: string;
}

export class AuthSignInDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;
}