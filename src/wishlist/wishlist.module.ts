import { Module } from '@nestjs/common';
import { WishlistService } from './wishlist.service';
import { WishlistController } from './wishlist.controller';
import { Wishlist } from './models/wishlist.model';
import { SequelizeModule } from '@nestjs/sequelize';
import { JwtModule } from '@nestjs/jwt';
import { Product } from '../product/models/product.model';
import { Customer } from '../customer/models/customer.model';

@Module({
  imports: [SequelizeModule.forFeature([Wishlist,Customer,Product]),JwtModule],
  controllers: [WishlistController],
  providers: [WishlistService],
})
export class WishlistModule {}
