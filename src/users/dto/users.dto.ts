import { IsEmail, IsNotEmpty, IsString, MinLength, MaxLength, Matches, IsOptional } from "class-validator";
import { lettersAndSpacesRegex } from "src/auth/dto/auth.dto";

export class ProfilePatchDataDto {
  @IsEmail({}, { message: 'Mmust be a valid email address' })
  @MaxLength(64, { message: 'Email is too long' })
  @IsOptional()
  email?: string;

  @IsString({ message: 'Password must be a string' })
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(64, { message: 'Password is too long' })
  @IsOptional()
  oldPassword?: string;

  @IsString({ message: 'Confirm password must be a string' })
  @IsNotEmpty({ message: 'Confirm password is required' })
  @MinLength(8, { message: 'Confirm password must be at least 8 characters long' })
  @MaxLength(64, { message: 'Confirm password is too long' })
  @IsOptional()
  newPassword?: string;

  @IsString({ message: 'First name must be a string' })
  @IsNotEmpty({ message: 'First name is required' })
  @MaxLength(64, { message: 'First name is too long' })
  @Matches(lettersAndSpacesRegex, { message: 'Name must be only letters and spaces' })
  @IsOptional()
  firstName?: string;

  @IsString({ message: 'Last name must be a string' })
  @IsNotEmpty({ message: 'Last name is required' })
  @MaxLength(64, { message: 'Last name is too long' })
  @Matches(lettersAndSpacesRegex, { message: 'Name must be only letters and spaces' })
  @IsOptional()
  lastName?: string;

  @IsString({ message: 'Age must be a string' })
  @IsNotEmpty({ message: 'Age is required' })
  @Matches(/^[1-9][0-9]?$/, { message: 'Age must be a number between 18 and 70' })
  @IsOptional()
  age?: string;

  @IsString({ message: 'Country must be a string' })
  @IsNotEmpty({ message: 'Country is required' })
  @MaxLength(64, { message: 'Country name is too long' })
  @IsOptional()
  country?: string;

  @IsString({ message: 'City must be a string' })
  @IsNotEmpty({ message: 'City is required' })
  @MaxLength(64, { message: 'City name is too long' })
  @IsOptional()
  city?: string;

  @IsString({ message: 'Work preference must be a string' })
  @IsNotEmpty({ message: 'Work preference is required' })
  @MaxLength(64, { message: 'Work preference is too long' })
  @IsOptional()
  workPreference?: string;
}