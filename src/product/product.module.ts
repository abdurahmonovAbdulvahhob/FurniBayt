import { Module } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { Product } from './models/product.model';
import { AdminGuard } from '../common/guards';

@Module({
  imports: [SequelizeModule.forFeature([Product])],
  controllers: [ProductController],
  providers: [ProductService, AdminGuard],
  exports: [SequelizeModule], // Product moduli boshqa modullarda foydalanish uchun eksport qilinadi
})
export class ProductModule {}
