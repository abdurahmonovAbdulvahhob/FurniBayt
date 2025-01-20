import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { PaginationDto } from 'src/admin/dto/pagination.dto';
import { createApiResponse } from '../common/utils';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './models/product.model';
import * as AWS from 'aws-sdk';

@Injectable()
export class ProductService {
  constructor(
    @InjectModel(Product)
    private readonly productModel: typeof Product,
  ) {}
  AWS_S3_BUCKET = 'furnibayt';
  s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey:
      process.env.AWS_SECRET_ACCESS_KEY
  });

  async create(
    createProductDto: CreateProductDto,
    files: Array<Express.Multer.File>,
  ) {
    let images = [];
    if (files) {
      images = await Promise.all(
        files?.map(async (file) => {
          return await this.s3_upload(
            file.buffer,
            this.AWS_S3_BUCKET,
            file.originalname,
            file.mimetype,
          );
        }),
      );
    }

    const newProduct = await this.productModel.create({
      ...createProductDto,
      image: images,
    });

    return createApiResponse(201, 'Product created successfully', {
      newProduct,
    });
  }

  async s3_upload(
    file: Buffer,
    bucket: string,
    name: string,
    mimetype: string,
  ) {
    const params = {
      Bucket: bucket,
      Key: String(name),
      Body: file,
      ContentType: mimetype,
      ContentDisposition: 'inline',
      CreateBucketConfiguration: {
        LocationConstraint: 'ap-south-1',
      },
    };

    try {
      const s3Response = await this.s3.upload(params).promise();
      return s3Response.Location;
    } catch (e) {
      console.log(e);
      throw new Error('File upload failed');
    }
  }

  /**
   * Retrieve all products with pagination, filtering, and ordering
   * @param query Pagination and filtering options
   */
  async findAll(query: PaginationDto) {
    const { filter, order = 'asc', page = 1, limit = 10 } = query;

    const offset = (page - 1) * limit;

    // Filtering condition
    const where = filter
      ? {
          [Op.or]: [
            { title: { [Op.like]: `%${filter}%` } },
            { description: { [Op.like]: `%${filter}%` } },
          ],
        }
      : {};

    // Find and count all products
    const { rows: products, count: total } =
      await this.productModel.findAndCountAll({
        where,
        order: [['createdAt', order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC']],
        offset,
        limit,
      });

    return createApiResponse(200, 'Products retrieved successfully', {
      products,
      total,
      page,
      limit,
    });
  }

  /**
   * Retrieve a product by ID
   * @param id
   */
  async findOne(id: number) {
    const product = await this.productModel.findOne({
      where: { id },
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
   * @param id
   * @param updateProductDto
   */
  async update(
    id: number,
    updateProductDto: UpdateProductDto,
    files: Array<Express.Multer.File>,
  ) {
    const product = await this.productModel.findOne({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    // Fayllar yuklash jarayoni
    let images = product.image || []; // Eski fayllarni oling

    if (files && files.length > 0) {
      const uploadedImages = await Promise.all(
        files.map(async (file) => {
          return await this.s3_upload(
            file.buffer,
            this.AWS_S3_BUCKET,
            file.originalname,
            file.mimetype,
          );
        }),
      );

      for (const image of images) {
        await this.s3_delete(image);
      }
      images = uploadedImages;
    }

    // Mahsulotni yangilash
    await this.productModel.update(
      { ...updateProductDto, image: images },
      { where: { id } },
    );

    const updatedProduct = await this.productModel.findOne({
      where: { id },
    });

    return createApiResponse(200, 'Product updated successfully', {
      updatedProduct,
    });
  }

  // Faylni S3 dan o'chirish uchun yordamchi funksiya
  async s3_delete(imageUrl: string) {
    const fileName = imageUrl.split('/').pop(); // Fayl nomini olish
    const params = {
      Bucket: this.AWS_S3_BUCKET,
      Key: fileName,
    };

    try {
      await this.s3.deleteObject(params).promise();
    } catch (error) {
      console.log('Failed to delete file from S3:', error.message);
    }
  }

  /**
   * Delete a product by ID
   * @param id
   */
  async remove(id: number) {
    const product = await this.productModel.findOne({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    await this.productModel.destroy({ where: { id } });

    return createApiResponse(200, `Product with ID ${id} deleted successfully`);
  }
}
