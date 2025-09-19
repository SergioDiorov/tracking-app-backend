import { Transform } from 'class-transformer';
import { IsInt, IsOptional, IsPositive } from 'class-validator';

export class PaginationParamsDto {
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
