import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateProductRatingDto {
  @ApiProperty({
    example: 5,
    description: 'Rating of the product',
    minimum: 1,
    maximum: 5,
  })
  @IsNumber()
  rating: number;

  @ApiProperty({
    example: '1',
    description: 'ID of the product',
  })
  @IsNumber()
  productId: number;

  @ApiProperty({
    example: '1',
    description: 'ID of the user',
  })
  @IsNumber()
  customerId: number;

  @ApiProperty({
    example: 'Great product!',
    description: 'Optional comment from the customer',
    required: false, // Mark as optional in the Swagger docs
  })
  @IsOptional()
  @IsString()
  comment?: string;
}
