import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  Length,
} from 'class-validator';

export class EmailCustomerDto {
  @ApiProperty({
    description: "Customer's email address",
    example: 'customer@gmail.com',
  })
  @IsEmail({}, { message: 'Invalid email address format' })
  @Length(3, 100, {
    message: 'Email length must be between 5 and 100 characters',
  })
  email: string;
}
