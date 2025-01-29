import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { CreateWishlistDto } from './dto/create-wishlist.dto';
import { createApiResponse } from '../common/utils';
import { Op } from 'sequelize';
import { Wishlist } from './models/wishlist.model';
import { Customer } from '../customer/models/customer.model';
import { Product } from '../product/models/product.model';

@Injectable()
export class WishlistService {
  constructor(
    @InjectModel(Wishlist) private readonly wishlistModel: typeof Wishlist,
    @InjectModel(Customer) private readonly customerModel: typeof Customer,
    @InjectModel(Product) private readonly productModel: typeof Product,
  ) {}

  async saveWishList(customerId: number, wishlist: number[]) {
    const customer = await this.customerModel.findByPk(customerId);
    if (!customer) {
      throw new NotFoundException(`Customer with id ${customerId} not found.`);
    }

    const existingWishlist = await this.wishlistModel.findAll({
      where: {
        customerId,
        productId: { [Op.in]: wishlist },
      },
    });

    const existingProductIds = existingWishlist.map(
      (wishlist) => wishlist.productId,
    );
    const newProductIds = wishlist.filter(
      (id) => !existingProductIds.includes(id),
    );

    if (newProductIds.length === 0) {
      return {
        statusCode: 200,
        message: 'No new products to add to the wishlist.',
      };
    }

    await this.wishlistModel.bulkCreate(
      newProductIds.map((productId) => ({ customerId, productId })),
    );

    return {
      statusCode: 201,
      message: 'Wishlist successfully updated.',
      data: { addedProductIds: newProductIds },
    };
  }

  async toggleWishlist(createWishlistDto: CreateWishlistDto) {
    const { customerId, productId } = createWishlistDto;

    const existingWishlist = await this.wishlistModel.findOne({
      where: { customerId, productId },
    });

    if (existingWishlist) {
      await existingWishlist.destroy();
      return createApiResponse(200, 'Wishlist item removed successfully', {
        existingWishlist,
      });
    } else {
      const customer = await this.customerModel.findByPk(customerId);
      if (!customer) {
        throw new NotFoundException(`Customer with id ${customerId} not found`);
      }

      const product = await this.productModel.findByPk(productId);
      if (!product) {
        throw new NotFoundException(`Product with id ${productId} not found`);
      }

      const newWishlist = await this.wishlistModel.create(createWishlistDto);
      return createApiResponse(201, 'Wishlist item added successfully', {
        newWishlist,
      });
    }
  }

  async getProductWishlist(customer_id: number) {
    const customer = await this.customerModel.findByPk(customer_id);
    if (!customer) {
      throw new BadRequestException(`User with ID: ${customer_id} not found.`);
    }

    const wishlists = await this.wishlistModel.findAll({
      where: { customerId: customer_id },
    });

    const wishlistProductIds = wishlists.map((wishlist) => +wishlist.productId);
    if (wishlistProductIds.length === 0) {
      return createApiResponse(
        200,
        'No wishlist products found for the customer',
        { products: [] },
      );
    }

    const products = await this.productModel.findAll({
      where: { id: { [Op.in]: wishlistProductIds } },
      include: [{ model: Product, as: 'discount', attributes: ['percent'] }],
    });

    const productsWithWishlist = products.map((product) => ({
      ...product.toJSON(),
      is_wishlisted: wishlistProductIds.includes(+product.id),
    }));

    return createApiResponse(200, 'All wishlist products for the customer', {
      products: productsWithWishlist,
    });
  }
}
