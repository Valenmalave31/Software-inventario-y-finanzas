import { IsOptional, IsString, MaxLength, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Generic search filter DTO with injection prevention
 * Used across all search endpoints
 */
export class SearchFilterDto {
  @IsOptional()
  @IsString({ message: 'Search term must be a string' })
  @MaxLength(255, { message: 'Search term cannot exceed 255 characters' })
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0, { message: 'Page must be >= 0' })
  page?: number = 0;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1, { message: 'Limit must be >= 1' })
  @Max(100, { message: 'Limit cannot exceed 100' })
  limit?: number = 20;

  @IsOptional()
  @IsString({ message: 'Sort field must be a string' })
  sortBy?: string;

  @IsOptional()
  @IsString({ message: 'Sort order must be ASC or DESC' })
  sortOrder?: 'ASC' | 'DESC' = 'ASC';
}