import { Module } from '@nestjs/common';
import { WishlistService } from './wishlist.service';
import { WishlistController } from './wishlist.controller';
import { Wishlist } from './models/wishlist.model';
import { SequelizeModule } from '@nestjs/sequelize';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [SequelizeModule.forFeature([Wishlist]),JwtModule],
  controllers: [WishlistController],
  providers: [WishlistService],
})
export class WishlistModule {}
