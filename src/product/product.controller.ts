import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PaginationDto } from 'src/admin/dto/pagination.dto';
import { AdminGuard } from '../common/guards';
import { Public } from '../common/decorators';

@ApiTags('Products')
@Controller('products')
@UseGuards(AdminGuard)
export class ProductController {
  constructor(private readonly productService: ProductService) {}


  @ApiOperation({ summary: 'Create a new product' })
  @ApiResponse({ status: 201, description: 'Product created successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid input.' })
  @Post()
  async create(@Body() createProductDto: CreateProductDto) {
    return await this.productService.create(createProductDto);
  }


  @ApiOperation({ summary: 'Retrieve all products' })
  @ApiQuery({
    name: 'filter',
    required: false,
    description: 'Filter products by name or description',
  })
  @ApiQuery({
    name: 'order',
    required: false,
    enum: ['asc', 'desc'],
    description: 'Sort order (ascending or descending)',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number for pagination',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of items per page',
    example: 10,
  })
  @ApiResponse({ status: 200, description: 'List of products retrieved.' })
  @Public()
  @Get()
  async findAll(@Query() query: PaginationDto) {
    return await this.productService.findAll(query);
  }

  @ApiOperation({ summary: 'Retrieve a product by ID' })
  @ApiResponse({ status: 200, description: 'Product retrieved successfully.' })
  @ApiResponse({ status: 404, description: 'Product not found.' })
  @Public()
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.productService.findOne(+id);
  }

 
  @ApiOperation({ summary: 'Update a product by ID' })
  @ApiResponse({ status: 200, description: 'Product updated successfully.' })
  @ApiResponse({ status: 404, description: 'Product not found.' })
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return await this.productService.update(+id, updateProductDto);
  }

  
  @ApiOperation({ summary: 'Delete a product by ID' })
  @ApiResponse({ status: 200, description: 'Product deleted successfully.' })
  @ApiResponse({ status: 404, description: 'Product not found.' })
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return await this.productService.remove(+id);
  }
}
