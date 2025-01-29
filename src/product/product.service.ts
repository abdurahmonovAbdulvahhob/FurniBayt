import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { PaginationDto } from 'src/admin/dto/pagination.dto';
import { ApiResponse, createApiResponse } from '../common/utils';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './models/product.model';
import * as AWS from 'aws-sdk';
import { ProductRating } from '../product_rating/models/product_rating.model';
import { Wishlist } from '../wishlist/models/wishlist.model';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class ProductService {
  constructor(
    private readonly jwtService: JwtService,
    @InjectModel(Product)
    private readonly productModel: typeof Product,
    @InjectModel(ProductRating)
    private readonly productRatingModel: typeof ProductRating,
    @InjectModel(Wishlist) private readonly wishlistModel: typeof Wishlist,
  ) {}

  AWS_S3_BUCKET = 'furnibayt';
  s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  });

  /**
   * Create a new product
   */
  async create(
    createProductDto: CreateProductDto,
    files: Array<Express.Multer.File>,
  ) {
    const images = files ? await this.uploadFilesToS3(files) : [];

    const newProduct = await this.productModel.create({
      ...createProductDto,
      image: images,
    });

    return createApiResponse(201, 'Product created successfully', {
      newProduct,
    });
  }

  /**
   * Retrieve all products with pagination, filtering, and ordering
   */
  async findAll(
    query: PaginationDto,
    token: string,
  ): Promise<
    ApiResponse<{
      products: Partial<Product>[];
      total: number;
      page: number;
      limit: number;
    }>
  > {
    const {
      filter,
      order = 'desc',
      page = 1,
      limit = 10,
      minPrice,
      maxPrice,
      sortBy = 'createdAt',
      categoryId, // Category ID
    } = query;

    const offset = (page - 1) * limit;

    let likedProductIds = [];
    if (token) {
      try {
        const { id } = this.jwtService.decode(token) as { id: string };
        if (id) {
          const likes = await this.wishlistModel.findAll({
            where: { customerId: +id },
          });
          likedProductIds = likes.map((like) => +like.productId);
        }
      } catch (error) {}
    }

    // Initialize where clause
    const where: any = {};

    // Add categoryId filter if provided
    if (categoryId) {
      where.categoryId = categoryId;
    }

    // Add price range filter
    if (minPrice !== undefined && maxPrice !== undefined) {
      where.price = { [Op.between]: [minPrice, maxPrice] };
    } else if (minPrice !== undefined) {
      where.price = { [Op.gte]: minPrice };
    } else if (maxPrice !== undefined) {
      where.price = { [Op.lte]: maxPrice };
    }

    // Add text filter (title or description)
    if (filter) {
      where[Op.or] = [
        { title: { [Op.like]: `%${filter}%` } },
        { description: { [Op.like]: `%${filter}%` } },
      ];
    }

    // Execute the query with all filters
    const { rows: products, count: total } =
      await this.productModel.findAndCountAll({
        where,
        order: [[sortBy, order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC']],
        offset,
        limit,
      });

    const productsWithLikes = products.map((product) => ({
      ...product.get(),
      is_liked: likedProductIds.includes(+product.id),
    }));

    return createApiResponse(200, 'Products retrieved successfully', {
      products: productsWithLikes,
      total,
      page,
      limit,
    });
  }

  /**
   * Retrieve a product by ID
   */
  async findOne(id: number) {
    const product = await this.productModel.findByPk(id, {
      include: { all: true },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return createApiResponse(200, 'Product retrieved successfully', {
      product,
    });
  }

  /**
   * Update a product by ID
   */
  async update(
    id: number,
    updateProductDto: UpdateProductDto,
    files: Array<Express.Multer.File>,
  ) {
    const product = await this.productModel.findByPk(id);

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    let images = product.image || [];

    if (files && files.length > 0) {
      const uploadedImages = await this.uploadFilesToS3(files);

      // Delete old images from S3
      for (const image of images) {
        await this.deleteFileFromS3(image);
      }

      images = uploadedImages;
    }

    await product.update({
      ...updateProductDto,
      image: images,
    });

    return createApiResponse(200, 'Product updated successfully', {
      product,
    });
  }

  /**
   * Delete a product by ID
   */
  /**
   * Delete a product by ID
   */
  async remove(id: number) {
    const product = await this.productModel.findByPk(id);

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    // Delete images from S3
    for (const image of product.image || []) {
      try {
        await this.deleteFileFromS3(image); // Rasmni S3 dan o'chirish
      } catch (error) {
        console.error('Failed to delete image from S3:', error.message);
        // Agar biror rasm o'chirib bo'lmasa, boshqa rasmlarni o'chirishni davom ettirish
      }
    }

    await this.productModel.destroy({ where: { id } });

    return createApiResponse(200, `Product with ID ${id} deleted successfully`);
  }

  /**
   * Upload multiple files to AWS S3
   */
  private async uploadFilesToS3(
    files: Array<Express.Multer.File>,
  ): Promise<string[]> {
    return Promise.all(
      files.map((file) =>
        this.uploadFileToS3(
          file.buffer,
          this.AWS_S3_BUCKET,
          file.originalname,
          file.mimetype,
        ),
      ),
    );
  }

  /**
   * Upload a single file to AWS S3
   */
  private async uploadFileToS3(
    file: Buffer,
    bucket: string,
    name: string,
    mimetype: string,
  ): Promise<string> {
    const params = {
      Bucket: bucket,
      Key: String(name),
      Body: file,
      ContentType: mimetype,
      ContentDisposition: 'inline',
    };

    try {
      const s3Response = await this.s3.upload(params).promise();
      return s3Response.Location;
    } catch (e) {
      console.error('File upload failed:', e.message);
      throw new BadRequestException('File upload failed');
    }
  }

  /**
   * Delete a file from AWS S3
   */
  private async deleteFileFromS3(imageUrl: string) {
    const fileName = imageUrl.split('/').pop();
    const params = {
      Bucket: this.AWS_S3_BUCKET,
      Key: fileName,
    };

    try {
      await this.s3.deleteObject(params).promise();
    } catch (error) {
      console.error('Failed to delete file from S3:', error.message);
    }
  }

  /**
   * Calculate average rating for a product
   */
  async calculateAverageRating(productId: number): Promise<number> {
    const result = await this.productRatingModel.findOne({
      where: { productId },
      attributes: [
        [
          this.productRatingModel.sequelize.fn(
            'AVG',
            this.productRatingModel.sequelize.col('rating'),
          ),
          'rating',
        ],
      ],
      raw: true,
    });

    // Ensure result.rating is a number before calling toFixed
    const averageRating =
      result?.rating != null ? parseFloat(result.rating as any) : 0;

    // Return the average rating rounded to 1 decimal place
    return parseFloat(averageRating.toFixed(1));
  }

  /**
   * Update average rating for a product
   */
  async updateAverageRating(productId: number): Promise<void> {
    // Calculate the average rating for the product
    const averageRating = await this.calculateAverageRating(productId);

    // Ensure the average rating is a valid number
    if (isNaN(averageRating)) {
      throw new Error('Calculated average rating is not a valid number');
    }

    // Update the product's average rating
    await this.productModel.update(
      { average_rating: parseFloat(averageRating.toFixed(2)) }, // Ensuring 2 decimal points
      { where: { id: productId } },
    );
  }
}
