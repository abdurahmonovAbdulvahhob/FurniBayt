import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class PaginationDto {
  @ApiProperty({
    description: 'Filter string for searching by title or description',
    required: false,
    example: 'chair',
  })
  @IsOptional()
  @IsString({ message: 'Filter must be a string' })
  readonly filter?: string;

  @ApiProperty({
    description: 'Sorting order: asc (ascending) or desc (descending)',
    required: false,
    example: 'asc',
  })
  @IsOptional()
  readonly order?: 'asc' | 'desc';

  @ApiProperty({
    description: 'Page number for pagination (starts from 1)',
    required: false,
    example: 1,
  })
  @IsOptional()
  @Type(() => Number) // Automatically convert query string to number
  @IsNumber({}, { message: 'Page must be a number' })
  @Min(1, { message: 'Page must be at least 1' })
  readonly page: number = 1; // Default page is 1

  @ApiProperty({
    description: 'Number of items per page',
    required: false,
    example: 10,
  })
  @IsOptional()
  @Type(() => Number) // Automatically convert query string to number
  @IsNumber({}, { message: 'Limit must be a number' })
  @Min(1, { message: 'Limit must be at least 1' })
  readonly limit: number = 10; // Default limit is 10

  @ApiProperty({
    description: 'Minimum price for filtering products',
    required: false,
    example: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Min price must be a number' })
  @Min(0, { message: 'Min price must be at least 0' })
  readonly minPrice?: number;

  @ApiProperty({
    description: 'Maximum price for filtering products',
    required: false,
    example: 1000,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Max price must be a number' })
  @Min(0, { message: 'Max price must be at least 0' })
  readonly maxPrice?: number;

  @ApiProperty({
    description: 'Field to sort by (e.g., "createdAt", "price")',
    required: false,
    example: 'createdAt',
  })
  @IsOptional()
  @IsString({ message: 'SortBy must be a string' })
  readonly sortBy?: 'createdAt' | 'price';
}
