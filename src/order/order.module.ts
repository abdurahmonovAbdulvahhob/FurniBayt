import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { Order } from './models/order.model';
import { SequelizeModule } from '@nestjs/sequelize';
import { Customer } from '../customer/models/customer.model';
import { Product } from '../product/models/product.model';
import { OrderAddressModule } from '../order_address/order_address.module';
import { OrderItemModule } from '../order_item/order_item.module';

@Module({
  imports: [
    SequelizeModule.forFeature([Order, Customer, Product]),
    OrderAddressModule,
    OrderItemModule,
  ],
  controllers: [OrderController],
  providers: [OrderService],
})
export class OrderModule {}
