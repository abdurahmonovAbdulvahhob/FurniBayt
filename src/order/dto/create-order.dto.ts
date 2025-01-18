import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsString } from "class-validator";

export class CreateOrderDto {
  @ApiProperty({
    example: '1',
    description: 'ID of the customer',
  })
  @IsNumber()
  customerId: number;

  @ApiProperty({
    example: '1',
    description: 'ID of the address',
  })
  @IsNumber()
  order_addressId: number;

  @ApiProperty({
    example: 'pending',
    description: 'Status of the order',
  })
  @IsString()
  status: 'new' | 'in-process' | 'rejected' | 'delivered';

  @ApiProperty({
    example: 20,
    description: 'total price of order',
  })
  @IsNumber()
  total_price: number;
}
