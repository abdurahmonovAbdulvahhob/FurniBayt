import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber } from 'class-validator';
import { CreateOrderItemDto } from '../../order_item/dto/create-order_item.dto';
import { CreateOrderAddressDto } from '../../order_address/dto/create-order_address.dto';

export class OrderDto {
  @ApiProperty({
    description: 'Customer ID who is placing the order',
    example: 1,
  })
  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  customerId: number;

  @ApiProperty({
    description: 'Address of the customer',
    type: CreateOrderAddressDto,
  })
  @IsNotEmpty()
  address: CreateOrderAddressDto;

  @ApiProperty({
    description: 'Order details (product, quantity, etc.)',
    type: CreateOrderItemDto,
    isArray: true,
  })
  @IsNotEmpty()
  order_details: CreateOrderItemDto[];

  @ApiProperty({
    description: 'Total price of the order',
    example: 150.75,
  })
  @IsNumber()
  readonly total_price: number;
}
