import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { PaginationDto } from 'src/admin/dto/pagination.dto';
import { createApiResponse } from '../common/utils';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './models/product.model';

@Injectable()
export class ProductService {
  constructor(
    @InjectModel(Product)
    private readonly productModel: typeof Product,
  ) {}

  async create(createProductDto: CreateProductDto) {
    const newProduct = await this.productModel.create(createProductDto);
    return createApiResponse(201, 'Product created successfully', {
      newProduct,
    });
  }

  async findAll(query: PaginationDto) {
    const { filter, order = 'asc', page = 1, limit = 10 } = query;

    const offset = (page - 1) * limit;

    const where = filter
      ? {
          [Op.or]: [
            { title: { [Op.like]: `%${filter}%` } },
            { description: { [Op.like]: `%${filter}%` } },
          ],
        }
      : {};

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

  async update(id: number, updateProductDto: UpdateProductDto) {
    const product = await this.productModel.findOne({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    await this.productModel.update(updateProductDto, {
      where: { id },
    });

    const updatedProduct = await this.productModel.findOne({
      where: { id },
    });

    return createApiResponse(200, 'Product updated successfully', {
      updatedProduct,
    });
  }


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
