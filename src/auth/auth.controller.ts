import { Controller, Post, Body, Res, HttpCode, UseGuards, BadRequestException, Get, Headers } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateAdminDto } from '../admin/dto/create-admin.dto';
import { Response } from 'express';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SignInAdminDto } from './dto/sign-in-admin.dto';
import { CookieGetter } from '../common/decorators';
import { CreateCustomerDto } from '../customer/dto/create-customer.dto';
import { SignInCustomerDto } from './dto/sign-in-user.dto';
import { EmailCustomerDto } from './dto/email-customer.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // @UseGuards(CreatorGuard)
  @ApiOperation({ summary: 'Register new Admin' })
  @ApiResponse({
    status: 201,
    description: 'Registered',
    type: Object,
  })
  @Post('signup-admin')
  async signUpAdmin(
    @Body() createAdminDto: CreateAdminDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.signUpAdmin(createAdminDto, res);
  }

  @ApiOperation({ summary: 'Sign in Admin' })
  @ApiResponse({
    status: 200,
    description: 'Sign in',
    type: Object,
  })
  @HttpCode(200)
  @Post('signin-admin')
  async signInAdmin(
    @Body() signInAdminDto: SignInAdminDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.signInAdmin(signInAdminDto, res);
  }

  @ApiOperation({ summary: 'Sign out Admin' })
  @ApiResponse({
    status: 200,
    description: 'Sign out',
    type: Object,
  })
  @HttpCode(200)
  @Post('signout-admin')
  async signOut(
    @CookieGetter('refresh_token') refresh_token: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.signOutAdmin(refresh_token, res);
  }

  @ApiOperation({ summary: 'Refresh Admin' })
  @ApiResponse({
    status: 200,
    description: 'Refresh',
    type: Object,
  })
  @HttpCode(200)
  @Post('refresh-admin')
  async refreshAdminToken(
    @CookieGetter('refresh_token') refresh_token: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.refreshAdminToken(refresh_token, res);
  }

  @ApiOperation({ summary: 'Register new User' })
  @ApiResponse({
    status: 201,
    description: 'Registered',
    type: Object,
  })
  @Post('signup-customer')
  async signUpCustomer(
    @Body() createCustomerDto: CreateCustomerDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.signUpCustomer(createCustomerDto, res);
  }

  @Post('newotp')
  @ApiOperation({ summary: 'Generate a new OTP for user' })
  @ApiResponse({ status: 200, description: 'OTP sent successfully' })
  @ApiResponse({ status: 400, description: 'Failed to send OTP' })
  async newOtp(@Body() emailClientDto: EmailCustomerDto) {
    if (!emailClientDto.email) {
      throw new BadRequestException('Email is required');
    }

    try {
      const result = await this.authService.newOtp(emailClientDto.email);
      return result;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Post('verifyotp')
  @ApiOperation({ summary: 'Verify the OTP for user' })
  @ApiResponse({ status: 200, description: 'OTP verified successfully' })
  @ApiResponse({ status: 400, description: 'Failed to verify OTP' })
  async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto) {
    const { email, otp, verification_key } = verifyOtpDto;

    if (!email || !otp || !verification_key) {
      throw new BadRequestException(
        'Email, OTP, and verification key are required',
      );
    }

    try {
      const result = await this.authService.verifyOtp(
        verification_key,
        otp,
        email,
      );
      return result;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @ApiOperation({ summary: 'Sign in User' })
  @ApiResponse({
    status: 200,
    description: 'Sign in',
    type: Object,
  })
  @HttpCode(200)
  @Post('signin-customer')
  async signInCustomer(
    @Body() signInCustomerDto: SignInCustomerDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.signInCustomer(
      signInCustomerDto.email,
      signInCustomerDto.password,
      res,
    );
  }

  @ApiOperation({ summary: 'Sign out User' })
  @ApiResponse({
    status: 200,
    description: 'Sign out',
    type: Object,
  })
  @HttpCode(200)
  @Post('signout-customer')
  async signOutCustomer(
    @CookieGetter('refresh_token') refresh_token: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.signOutCustomer(refresh_token, res);
  }

  @ApiOperation({ summary: 'Refresh Token User' })
  @ApiResponse({
    status: 200,
    description: 'Refresh',
    type: Object,
  })
  @HttpCode(200)
  @Post('refresh-customer')
  async refreshCustomerToken(
    @CookieGetter('refresh_token') refresh_token: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.refreshCustomerToken(refresh_token, res);
  }

  @Get('check-token')
  async checkToken(@Headers('authorization') authorization: string) {
    if (!authorization) {
      throw new BadRequestException('Authorization token is required');
    }

    const token = authorization.replace('Bearer ', '').trim();
    return this.authService.checkToken(token);
  }
}
