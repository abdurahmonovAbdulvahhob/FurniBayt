import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsPhoneNumber, IsString } from 'class-validator';

export class VerifyOtpDto {
  @ApiProperty({
    description: 'Verification key',
    example: 'dbasvchsacbbhjas',
  })
  @IsString()
  @IsNotEmpty()
  verification_key: string;

  @ApiProperty({
    description: 'One time passport(4 numbers)',
    example: '1234',
  })
  @IsString()
  @IsNotEmpty()
  otp: string;

  @ApiProperty({
    description: "Client's email address",
    example: 'client@gmail.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
