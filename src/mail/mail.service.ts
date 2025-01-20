import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { Customer } from '../customer/models/customer.model';

@Injectable()
export class MailService {
  constructor(private mailerService: MailerService) {}

  async sendMail(customer: Customer) {
    const url = `${process.env.API_URL}:${process.env.PORT}/customer/activate/${customer.activation_link}`;
    await this.mailerService.sendMail({
      to: customer.email,
      subject: 'Activate your Furnibayt account',
      template: './confirm',
      context: {
        full_name: `${customer.first_name} ${customer.last_name}`,
        url,
      },
    });
  }

  async sendOtp(email: string, otp: string) {
    try {
      await this.mailerService.sendMail({
        to: email,
        subject: 'Furnibayt account verification',
        template: './otp',
        context: {
          otp,
        },
      });
      return true;
    } catch (error) {
      console.log('Error while sending OTP:', error);
      return false;
    }
  }
}
