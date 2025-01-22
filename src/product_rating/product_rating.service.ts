import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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
    private readonly productRatingModel: typeof ProductRating,
    private readonly productService: ProductService,
    @InjectModel(Customer)
    private readonly customerModel: typeof Customer,
  ) {}

  /**
   * Helper function: Find product by ID
   */
  private async findProductById(productId: number) {
    const product = await this.productService.findOne(productId);
    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }
    return product;
  }

  /**
   * Helper function: Find customer by ID
   */
  private async findCustomerById(customerId: number) {
    const customer = await this.customerModel.findOne({
      where: { id: customerId },
    });
    if (!customer) {
      throw new NotFoundException(`Customer with ID ${customerId} not found`);
    }
    return customer;
  }

  /**
   * Create a new product rating
   */
  async create(createProductRatingDto: CreateProductRatingDto) {
    const { productId, customerId } = createProductRatingDto;

    // Verify product and customer existence
    await this.findProductById(productId);
    await this.findCustomerById(customerId);

    // Check for duplicate rating
    const existingRating = await this.productRatingModel.findOne({
      where: { productId, customerId },
    });
    if (existingRating) {
      throw new ConflictException('Customer has already rated this product');
    }

    // Create a new rating
    const productRating = await this.productRatingModel.create(
      createProductRatingDto,
    );

    // Update average rating for the product
    await this.productService.updateAverageRating(productId);

    return productRating;
  }

  /**
   * Retrieve all product ratings
   */
  async findAll() {
    return await this.productRatingModel.findAll({ include: { all: true } });
  }

  /**
   * Retrieve a single product rating by ID
   */
  async findOne(id: number) {
    const rating = await this.productRatingModel.findOne({
      where: { id },
      include: { all: true },
    });
    if (!rating) {
      throw new NotFoundException(`Product rating with ID ${id} not found`);
    }
    return rating;
  }

  /**
   * Update a product rating
   */
  async update(id: number, updateProductRatingDto: UpdateProductRatingDto) {
    const existingRating = await this.findOne(id);

    const { productId, customerId, rating } = updateProductRatingDto;

    // Verify product if `productId` is updated
    if (productId && productId !== existingRating.productId) {
      await this.findProductById(productId);
    }

    // Verify customer if `customerId` is updated
    if (customerId && customerId !== existingRating.customerId) {
      await this.findCustomerById(customerId);
    }

    // Check for duplicate rating if `productId` or `customerId` is updated
    if (
      (productId && productId !== existingRating.productId) ||
      (customerId && customerId !== existingRating.customerId)
    ) {
      const duplicateRating = await this.productRatingModel.findOne({
        where: {
          productId: productId || existingRating.productId,
          customerId: customerId || existingRating.customerId,
        },
      });
      if (duplicateRating) {
        throw new ConflictException('Customer has already rated this product');
      }
    }

    // Update the rating
    const [_, [updatedRating]] = await this.productRatingModel.update(
      updateProductRatingDto,
      {
        where: { id },
        returning: true,
      },
    );

    // Update average rating for the product if rating value changed
    if (rating) {
      await this.productService.updateAverageRating(updatedRating.productId);
    }

    return updatedRating;
  }

  /**
   * Remove a product rating by ID
   */
  async remove(id: number) {
    const existingRating = await this.findOne(id);

    // Delete the rating
    await this.productRatingModel.destroy({ where: { id } });

    // Update average rating for the product
    await this.productService.updateAverageRating(existingRating.productId);

    return { message: `Product rating with ID ${id} successfully deleted` };
  }
}
