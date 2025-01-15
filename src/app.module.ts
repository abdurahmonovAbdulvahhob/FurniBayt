import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import { CustomerModule } from './customer/customer.module';
import { AuthModule } from './auth/auth.module';
import { AdminModule } from './admin/admin.module';
import { PaymentMethodModule } from './payment_method/payment_method.module';
@Module({
  imports: [
    ConfigModule.forRoot({ envFilePath: '.env', isGlobal: true }),
    SequelizeModule.forRoot({
      dialect: 'postgres',
      host: process.env.POSTGRES_HOST,
      port: +process.env.POSTGRES_PORT,
      username: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      database: process.env.POSTGRES_DB,
      models: [],
      logging: false,
      autoLoadModels: true,
      sync: { alter: true },
    }),
    AdminModule,
    AuthModule,
    CustomerModule,
    PaymentMethodModule,

  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
