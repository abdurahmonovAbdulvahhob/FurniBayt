import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateProductRatingDto } from './dto/create-product_rating.dto';
import { UpdateProductRatingDto } from './dto/update-product_rating.dto';
import { InjectModel } from '@nestjs/sequelize';
import { ProductRating } from './models/product_rating.model';
import { ProductService } from '../product/product.service';
import { Customer } from '../customer/models/customer.model';

@Injectable()
export class ProductRatingService {
  constructor(
    @InjectModel(ProductRating)
    private product_ratingModel: typeof ProductRating,
    private productService: ProductService,
    @InjectModel(Customer)
    private customerModel: typeof Customer,
  ) {}
  async create(createProductRatingDto: CreateProductRatingDto) {
    const product = await this.productService.findOne(
      createProductRatingDto.productId,
    );
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    const customer = await this.customerModel.findOne({
      where: { id: createProductRatingDto.customerId },
    });
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    const existingRating = await this.product_ratingModel.findOne({
      where: {
        productId: createProductRatingDto.productId,
        customerId: createProductRatingDto.customerId,
      },
    });

    if (existingRating) {
      throw new ConflictException('Customer has already rated this product');
    }
    const product_rating = await this.product_ratingModel.create(
      createProductRatingDto,
    );
    await this.productService.updateAverageRating(product_rating.productId);
    return product_rating;
  }

  findAll() {
    return this.product_ratingModel.findAll({ include: { all: true } });
  }

  findOne(id: number) {
    return this.product_ratingModel.findOne({
      where: { id },
      include: { all: true },
    });
  }

  async update(id: number, updateProductRatingDto: UpdateProductRatingDto) {
    const existingRating = await this.product_ratingModel.findOne({
      where: { id },
    });
    if (!existingRating) {
      throw new NotFoundException('Product rating not found');
    }

    // Mahsulotni tekshirish (agar `productId` yangilansa)
    if (
      updateProductRatingDto.productId &&
      updateProductRatingDto.productId !== existingRating.productId
    ) {
      const product = await this.productService.findOne(
        updateProductRatingDto.productId,
      );
      if (!product) {
        throw new NotFoundException('Product not found');
      }
    }

    // Mijozni tekshirish (agar `customerId` yangilansa)
    if (
      updateProductRatingDto.customerId &&
      updateProductRatingDto.customerId !== existingRating.customerId
    ) {
      const customer = await this.customerModel.findOne({
        where: { id: updateProductRatingDto.customerId },
      });
      if (!customer) {
        throw new NotFoundException('Customer not found');
      }
    }

    // Takroriy bahoni tekshirish (agar `productId` yoki `customerId` yangilansa)
    if (
      (updateProductRatingDto.productId &&
        updateProductRatingDto.productId !== existingRating.productId) ||
      (updateProductRatingDto.customerId &&
        updateProductRatingDto.customerId !== existingRating.customerId)
    ) {
      const duplicateRating = await this.product_ratingModel.findOne({
        where: {
          productId:
            updateProductRatingDto.productId || existingRating.productId,
          customerId:
            updateProductRatingDto.customerId || existingRating.customerId,
        },
      });

      if (duplicateRating) {
        throw new ConflictException('Customer has already rated this product');
      }
    }

    // Bahoni yangilash
    const [affectedRows, [updatedRating]] =
      await this.product_ratingModel.update(updateProductRatingDto, {
        where: { id },
        returning: true,
      });

    // Agar baho yangilangan bo'lsa, o'rtacha bahoni yangilash
    if (updateProductRatingDto.rating) {
      await this.productService.updateAverageRating(updatedRating.productId);
    }

    return updatedRating;
  }

  remove(id: number) {
    return this.product_ratingModel.destroy({ where: { id } });
  }
}
