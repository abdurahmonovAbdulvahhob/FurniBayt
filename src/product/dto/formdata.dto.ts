import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsString,
  IsArray,
  IsOptional,
  IsNumber,
  Length,
  Min,
  Max,
} from 'class-validator';

export class FormDataDto {
  @ApiProperty({
    description: 'ID of the category the product belongs to',
    example: 1,
  })
  @IsNumber()
  @Type(() => Number)
  categoryId: number;

  @ApiProperty({
    type: 'array',
    description: 'Array of image files (images)',
    items: {
      type: 'string',
      example: 'example.jpg',
      format: 'binary',
    },
  })
  @IsArray()
  @IsOptional()
  image: string[];

  @ApiProperty({
    description: 'Name of product',
    example: 'Wireless Headphones',
  })
  @IsString({ message: 'Name must be a string.' })
  @Length(1, 255, { message: 'Name must be between 1 and 255 characters.' })
  title: string;

  @ApiProperty({
    description: 'Detailed description of the product',
    example: 'High-quality wireless headphones with noise cancellation',
  })
  @IsString({ message: 'Description must be a string.' })
  @Length(1, 255, {
    message: 'Description must be between 1 and 255 characters.',
  })
  description: string;

  @ApiProperty({ description: 'Price of the product', example: 199 })
  @IsNumber()
  @Min(0, { message: 'Price must be at least 0.' })
  @Type(() => Number)
  price: number;

  @ApiProperty({ description: 'Average rating of the product', example: 5 })
  @Type(() => Number)
  @IsInt({ message: 'Average rating must be an integer.' })
  @Min(0, { message: 'Average rating must be at least 0.' })
  @Max(5)
  average_rating: number;

  @ApiProperty({ description: 'Stock quantity of the product', example: 50 })
  @Type(() => Number)
  @IsInt({ message: 'Stock must be an integer.' })
  @Min(0, { message: 'Stock must be at least 0.' })
  stock: number;

  @ApiProperty({
    description: 'Array of colors available for the product',
    example: ['red', 'blue', 'green'],
    nullable: true,
  })
  @IsString()
  color: string;

  @ApiProperty({
    description: 'Stock Keeping Unit identifier',
    example: 'SKU-12345',
  })
  @IsString({ message: 'SKU must be a string.' })
  sku: string;

  @ApiProperty({
    example: 'Additional information about the product',
    description: 'Additional info of the product',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'The additional info must be a string.' })
  additional_info?: string;

  @ApiProperty({
    description: 'Array of tags associated with the product',
    example: ['electronics', 'wireless', 'headphones'],
    nullable: true,
  })
  @IsString()
  tags: string;
}
