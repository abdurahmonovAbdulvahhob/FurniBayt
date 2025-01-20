import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { AdminModule } from '../admin/admin.module';
import { JwtModule } from '@nestjs/jwt';
import { CustomerModule } from '../customer/customer.module';
import { MailModule } from '../mail/mail.module';
import { Otp } from 'src/otp/models/otp.model';
import { Customer } from 'src/customer/models/customer.model';
import { SequelizeModule } from '@nestjs/sequelize';

@Module({
  imports: [
    AdminModule,
    CustomerModule,
    MailModule,
    SequelizeModule.forFeature([Otp, Customer]),
    JwtModule.register({}),
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
