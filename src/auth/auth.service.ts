import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { Admin } from '../admin/models/admin.model';
import { JwtService } from '@nestjs/jwt';
import { AdminService } from '../admin/admin.service';
import { Tokens } from '../common/types';
import { CreateAdminDto } from '../admin/dto/create-admin.dto';
import * as bcrypt from 'bcrypt';
import * as uuid from 'uuid';
import { Response } from 'express';
import { SignInAdminDto } from './dto/sign-in-admin.dto';
import { CreateCustomerDto } from '../customer/dto/create-customer.dto';
import { CustomerService } from '../customer/customer.service';
import { Customer } from '../customer/models/customer.model';
import { MailService } from '../mail/mail.service';
import * as otpGenerator from 'otp-generator';
import { InjectModel } from '@nestjs/sequelize';
import { Otp } from 'src/otp/models/otp.model';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(Otp) private otpModel: typeof Otp,
    @InjectModel(Customer) private customerModel: typeof Customer,
    private readonly jwtService: JwtService,
    private readonly adminService: AdminService,
    private readonly customerService: CustomerService,
    private readonly mailService: MailService,
  ) {}
  async generateAdminTokens(admin: Admin): Promise<Tokens> {
    const payload = {
      id: admin.id,
      email: admin.email,
      is_creator: admin.is_creator,
    };
    const [access_token, refresh_token] = await Promise.all([
      this.jwtService.sign(payload, {
        secret: process.env.ACCESS_TOKEN_ADMIN_KEY,
        expiresIn: process.env.ACCESS_TOKEN_TIME,
      }),
      this.jwtService.sign(payload, {
        secret: process.env.REFRESH_TOKEN_ADMIN_KEY,
        expiresIn: process.env.REFRESH_TOKEN_TIME,
      }),
    ]);
    return { access_token, refresh_token };
  }

  async updateAdminRefreshToken(adminId: number, refresh_token: string) {
    const hashed_refresh_token = await bcrypt.hash(refresh_token, 3);
    await this.adminService.updateRefreshToken(adminId, hashed_refresh_token);
  }

  async signUpAdmin(createAdminDto: CreateAdminDto, res: Response) {
    const newAdmin = await this.adminService.create(createAdminDto);
    newAdmin.is_creator = false;
    await newAdmin.save();
    console.log(newAdmin);
    if (!newAdmin) {
      throw new InternalServerErrorException("Yangi Admin qo'shishda xatolik");
    }

    const tokens = await this.generateAdminTokens(newAdmin);
    await this.updateAdminRefreshToken(newAdmin.id, tokens.refresh_token);
    res.cookie('refresh_token', tokens.refresh_token, {
      maxAge: +process.env.COOKIE_TIME,
      httpOnly: true,
    });

    return { id: newAdmin.id, access_token: tokens.access_token };
  }

  async signInAdmin(signInAdminDto: SignInAdminDto, res: Response) {
    const admin = await this.adminService.findByLogin(signInAdminDto.email);

    if (!admin) {
      throw new UnauthorizedException('Email or Password incrrect');
    }

    const validPassword = await bcrypt.compare(
      signInAdminDto.password,
      admin.hashed_password,
    );

    if (!validPassword) {
      throw new UnauthorizedException('Email or Password incrrect');
    }

    admin.is_active = true;
    await admin.save();

    const tokens = await this.generateAdminTokens(admin);
    await this.updateAdminRefreshToken(admin.id, tokens.refresh_token);
    res.cookie('refresh_token', tokens.refresh_token, {
      maxAge: +process.env.COOKIE_TIME,
      httpOnly: true,
    });

    return {
      message: 'Admin signed in succesfully',
      id: admin.id,
      access_token: tokens.access_token,
    };
  }

  async signOutAdmin(refresh_token: string, res: Response) {
    try {
      if (!refresh_token) {
        throw new BadRequestException('Refresh token is required');
      }
      const payload = await this.jwtService.verify(refresh_token, {
        secret: process.env.REFRESH_TOKEN_ADMIN_KEY,
      });
      if (!payload) {
        throw new BadRequestException('Invalid refresh token1');
      }
      // console.log(payload)
      const admin = await this.adminService.findByLogin(payload.email);
      if (!admin) {
        throw new BadRequestException('Invalid refresh token2');
      }
      admin.hashed_refresh_token = null;
      admin.save();

      res.clearCookie('refresh_token');

      return { message: 'Admin signed  out' };
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(error);
    }
  }

  async refreshAdminToken(refresh_token: string, res: Response) {
    try {
      const payload = await this.jwtService.verify(refresh_token, {
        secret: process.env.REFRESH_TOKEN_ADMIN_KEY,
      });
      const admin = await this.adminService.findByLogin(payload.email);
      if (!admin) {
        throw new BadRequestException('Invalid refresh token');
      }

      const validRefreshToken = await bcrypt.compare(
        refresh_token,
        admin.hashed_refresh_token,
      );

      if (!validRefreshToken) {
        throw new ForbiddenException('Invalid refresh token');
      }

      const tokens = await this.generateAdminTokens(admin);
      await this.updateAdminRefreshToken(admin.id, tokens.refresh_token);
      res.cookie('refresh_token', tokens.refresh_token, {
        maxAge: +process.env.COOKIE_TIME,
        httpOnly: true,
      });

      return {
        message: 'Token refreshed successfully',
        id: admin.id,
        access_token: tokens.access_token,
      };
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException();
    }
  }

  async generateCustomerTokens(customer: Customer): Promise<Tokens> {
    const payload = {
      id: customer.id,
      email: customer.email,
      is_active: customer.is_active,
    };
    const [access_token, refresh_token] = await Promise.all([
      this.jwtService.sign(payload, {
        secret: process.env.ACCESS_TOKEN_CUSTOMER_KEY,
        expiresIn: process.env.ACCESS_TOKEN_TIME,
      }),
      this.jwtService.sign(payload, {
        secret: process.env.REFRESH_TOKEN_CUSTOMER_KEY,
        expiresIn: process.env.REFRESH_TOKEN_TIME,
      }),
    ]);
    return { access_token, refresh_token };
  }

  async updateCustomerRefreshToken(
    customerId: number,
    refresh_token: string,
    activation_link?: string,
  ) {
    const hashed_refresh_token = await bcrypt.hash(refresh_token, 3);
    const updatedCustomer = await this.customerService.updateRefreshToken(
      customerId,
      hashed_refresh_token,
      activation_link,
    );

    return updatedCustomer;
  }

  async signUpCustomer(createCustomerDto: CreateCustomerDto, res: Response) {
    const user = await this.customerService.findUserByEmail(
      createCustomerDto.email,
    );
    if (user) {
      throw new BadRequestException('User already exists');
    }

    if (createCustomerDto.password !== createCustomerDto.confirm_password) {
      throw new BadRequestException('Passwords do not match');
    }

    const newUser = await this.customerService.create({
      ...createCustomerDto,
    });

    const tokens = await this.generateCustomerTokens(newUser);

    // const activation_link = uuid.v4();
    const updatedUser = await this.updateCustomerRefreshToken(
      newUser.id,
      tokens.refresh_token,
      // activation_link,
    );

    res.cookie('refresh_token', tokens.refresh_token, {
      httpOnly: true,
      maxAge: +process.env.COOKIE_TIME,
    });

    //   try {
    //     await this.mailService.sendMail(updatedUser);
    //   } catch (error) {
    //     console.log(error);
    //     throw new InternalServerErrorException('Error sending mail');
    //   }

    //   const response = {
    //     message: 'Customer registered successfully',
    //     customer: updatedUser,
    //     access_token: tokens.access_token,
    //   };
    //   return response;

    const otp = otpGenerator.generate(4, {
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    });

    const email = createCustomerDto.email;

    const isSend = await this.mailService.sendOtp(email, otp);

    if (!isSend) {
      throw new BadRequestException('OTP yuborishda xatolik yuz berdi.');
    }

    const now = new Date();
    const expiration = new Date(now.getTime() + 2 * 60000); // 2 minutes

    await this.otpModel.destroy({ where: { email } });

    const newOtp = await this.otpModel.create({
      id: uuid.v4(),
      otp,
      expiration,
      email,
    });

    const encodedData = Buffer.from(
      JSON.stringify({
        email,
        otp_id: newOtp.id,
        timestamp: now,
      }),
    ).toString('base64');

    return {
      message: `OTP code has been sent to ${email}`,
      verification_key: encodedData,
    };
  }

  async signInCustomer(email: string, password: string, res: Response) {
    const user = await this.customerService.findUserByEmail(email);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    const isMatch = await bcrypt.compare(password, user.hashed_password);

    if (!isMatch) {
      throw new BadRequestException('Invalid password');
    }

    if (user.is_active === false) {
      const otp = otpGenerator.generate(4, {
        upperCaseAlphabets: false,
        lowerCaseAlphabets: false,
        specialChars: false,
      });
      const isSend = await this.mailService.sendOtp(user.email, otp);

      if (!isSend) {
        throw new BadRequestException('OTP yuborishda xatolik yuz berdi.');
      }
      const now = new Date();
      const expiration_time = new Date(now.getTime() + 2 * 60000); // 2 minutes

      await this.otpModel.destroy({ where: { email: user.email } });
      const newOtp = await this.otpModel.create({
        id: uuid.v4(),
        otp,
        expiration: expiration_time,
        email: user.email,
      });
      const encodedData = Buffer.from(
        JSON.stringify({
          email: user.email,
          otp_id: newOtp.id,
          timestamp: now,
        }),
      ).toString('base64');
      return res.json({
        verification_key: encodedData,
      });
    }

    const tokens = await this.generateCustomerTokens(user);

    await this.updateCustomerRefreshToken(user.id, tokens.refresh_token);
    res.cookie('refresh_token', tokens.refresh_token, {
      maxAge: +process.env.COOKIE_TIME,
      httpOnly: true,
    });

    return {
      message: 'User signed in succesfully',
      id: user.id,
      access_token: tokens.access_token,
    };
  }

  async signOutCustomer(refresh_token: string, res: Response) {
    try {
      if (!refresh_token) {
        throw new BadRequestException('Refresh token is required');
      }
      const payload = await this.jwtService.verify(refresh_token, {
        secret: process.env.REFRESH_TOKEN_CUSTOMER_KEY,
      });
      if (!payload) {
        throw new BadRequestException('Invalid refresh token1');
      }
      // console.log(payload)
      const user = await this.customerService.findUserByEmail(payload.email);
      if (!user) {
        throw new BadRequestException('Invalid refresh token2');
      }
      user.hashed_refresh_token = null;
      user.save();

      res.clearCookie('refresh_token');

      return { message: 'User signed  out succesfuly' };
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(error);
    }
  }

  async refreshCustomerToken(refresh_token: string, res: Response) {
    try {
      const payload = await this.jwtService.verify(refresh_token, {
        secret: process.env.REFRESH_TOKEN_CUSTOMER_KEY,
      });
      const customer = await this.customerService.findUserByEmail(
        payload.email,
      );
      if (!customer) {
        throw new BadRequestException('Invalid refresh token');
      }

      const validRefreshToken = await bcrypt.compare(
        refresh_token,
        customer.hashed_refresh_token,
      );

      if (!validRefreshToken) {
        throw new ForbiddenException('Invalid refresh token');
      }

      const tokens = await this.generateCustomerTokens(customer);
      await this.updateCustomerRefreshToken(customer.id, tokens.refresh_token);
      res.cookie('refresh_token', tokens.refresh_token, {
        maxAge: +process.env.COOKIE_TIME,
        httpOnly: true,
      });

      return {
        message: 'Token refreshed successfully',
        id: customer.id,
        access_token: tokens.access_token,
      };
    } catch (error) {
      console.log('refreshcustomer error', error);
      throw new InternalServerErrorException();
    }
  }

  async checkToken(token: string) {
    try {
      const decodedData = await this.jwtService.verify(token, {
        secret: process.env.ACCESS_TOKEN_CUSTOMER_KEY,
      });
      if (!decodedData) {
        throw new UnauthorizedException('Token invalid or expired');
      }

      const response = await this.customerService.findUserByEmail(
        decodedData.email,
      );
      if (!response) {
        throw new UnauthorizedException('Customer not found');
      }
      const customer = {
        id: response.id,
        first_name: response.first_name,
        last_name: response.last_name,
        is_active: response.is_active,
        phone: response.phone,
        email: response.email,
      };

      return { message: 'Token is valid', statusCode: 200, customer };
    } catch (error) {
      throw new UnauthorizedException('Token invalid or expired');
    }
  }

  async newOtp(
    email: string,
  ): Promise<{ message: string; verification_key: string }> {
    const otp = otpGenerator.generate(4, {
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    });

    const client = await this.customerModel.findOne({ where: { email } });
    if (!client) {
      throw new BadRequestException(`Email ${email} does not exists!`);
    } else if (client.is_active === true) {
      throw new BadRequestException('Client already activated!');
    }

    const isSend = await this.mailService.sendOtp(email, otp);

    if (!isSend) {
      throw new BadRequestException('Error sending OTP');
    }

    const now = new Date();
    const expiration = new Date(now.getTime() + 2 * 60000); // 2 minutes

    await this.otpModel.destroy({ where: { email } });

    const newOtp = await this.otpModel.create({
      id: uuid.v4(),
      otp,
      expiration,
      email,
    });

    const encodedData = Buffer.from(
      JSON.stringify({
        email,
        otp_id: newOtp.id,
        timestamp: now,
      }),
    ).toString('base64');

    return {
      message: `OTP code has been sent to ${email}`,
      verification_key: encodedData,
    };
  }

  async verifyOtp(
    verification_key: string,
    otp: string,
    email: string,
  ): Promise<any> {
    const decodedData = JSON.parse(
      Buffer.from(verification_key, 'base64').toString('ascii'),
    );

    if (decodedData.email !== email) {
      throw new BadRequestException('Bu email uchun OTP yuborilmagan.');
    }

    const otpRecord = await this.otpModel.findOne({
      where: { id: decodedData.otp_id },
    });

    if (!otpRecord) {
      throw new BadRequestException('OTP mavjud emas.');
    }

    if (otpRecord.verified) {
      throw new BadRequestException('Bu OTP avval tekshirilgan.');
    }

    if (otpRecord.expiration < new Date()) {
      throw new BadRequestException('OTPning vaqti tugagan.');
    }

    if (otpRecord.otp !== otp) {
      throw new BadRequestException('OTP mos emas.');
    }

    await this.otpModel.update({ verified: true }, { where: { email } });

    await this.customerModel.update({ is_active: true }, { where: { email } });

    const user = await this.customerModel.findOne({ where: { email } });

    const tokens = await this.generateCustomerTokens(user);

    return {
      message: 'OTP successfully confirmed',
      user: user,
      access_token: tokens.access_token,
    };
  }
}
