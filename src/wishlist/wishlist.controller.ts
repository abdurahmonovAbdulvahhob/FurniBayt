import {
  Controller,
  Get,
  Post,
  Body,
  Delete,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { WishlistService } from './wishlist.service';
import { CreateWishlistDto } from './dto/create-wishlist.dto';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UserGuard } from '../common/guards';
import { UserSelfGuard } from '../common/guards/user-self.guard';

@Controller('wishlist')
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @UseGuards(UserGuard)
  @ApiOperation({ summary: 'Create or toggle a wishlist item' })
  @ApiResponse({
    status: 200,
    description: 'Create or toggle wishlist item',
    type: Object,
  })
  @Post('toggle')
  toggle(@Body() createWishlistDto: CreateWishlistDto) {
    return this.wishlistService.toggleWishlist(createWishlistDto);
  }

  @UseGuards(UserSelfGuard)
  @ApiOperation({ summary: 'Get all wishlist items of the current user' })
  @ApiResponse({
    status: 200,
    description: 'Get all wishlist items of the current user',
    type: Object,
  })
  @Get('get')
  getAll(@Req() req: any) {
    return this.wishlistService.getProductWishlist(req.user.id);
  }
}
