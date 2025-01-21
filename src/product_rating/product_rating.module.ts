import { Module } from '@nestjs/common';
import { ProductRatingService } from './product_rating.service';
import { ProductRatingController } from './product_rating.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { ProductRating } from './models/product_rating.model';
import { Product } from '../product/models/product.model';
import { ProductModule } from '../product/product.module';
import { Customer } from '../customer/models/customer.model';

@Module({
  imports: [SequelizeModule.forFeature([ProductRating,Product,Customer]),ProductModule],
  controllers: [ProductRatingController],
  providers: [ProductRatingService],
})
export class ProductRatingModule {}
