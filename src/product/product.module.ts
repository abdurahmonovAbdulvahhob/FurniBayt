import { Module } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { Product } from './models/product.model';
import { AdminGuard } from '../common/guards';
import { ProductRating } from '../product_rating/models/product_rating.model';
import { Wishlist } from '../wishlist/models/wishlist.model';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [SequelizeModule.forFeature([Product,ProductRating,Wishlist]),JwtModule],
  controllers: [ProductController],
  providers: [ProductService, AdminGuard],
  exports: [SequelizeModule, ProductService], // Product moduli boshqa modullarda foydalanish uchun eksport qilinadi
})
export class ProductModule {}
