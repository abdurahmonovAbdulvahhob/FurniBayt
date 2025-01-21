import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Put,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { CreateProductDetailDto } from './dto/create-product_detail.dto';
import { UpdateProductDetailDto } from './dto/update-product_detail.dto';
import { ProductDetailsService } from './product_details.service';
import { PaginationDto } from 'src/admin/dto/pagination.dto';
import { AdminGuard } from 'src/common/guards';
import { Public } from 'src/common/decorators';

@ApiTags('Product Details')
@Controller('product-details')
@UseGuards(AdminGuard)
export class ProductDetailsController {
  constructor(private readonly productDetailsService: ProductDetailsService) {}

  @ApiOperation({ summary: 'Create a new product detail' })
  @ApiResponse({
    status: 201,
    description: 'Product detail created successfully.',
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @Post()
  async create(@Body() createProductDetailDto: CreateProductDetailDto) {
    return await this.productDetailsService.create(createProductDetailDto);
  }

  
  @ApiOperation({
    summary:
      'Retrieve all product details with optional filtering, sorting, and pagination',
  })
  @ApiQuery({
    name: 'filter',
    required: false,
    description: 'Filter by product detail fields',
  })
  @ApiQuery({
    name: 'order',
    required: false,
    enum: ['asc', 'desc'],
    description: 'Order of sorting',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Items per page',
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: 'List of product details retrieved successfully.',
  })
  @Public()
  @Get()
  async findAll(@Query() query: PaginationDto) {
    return await this.productDetailsService.findAll(query);
  }

  @ApiOperation({ summary: 'Retrieve a single product detail by ID' })
  @ApiResponse({
    status: 200,
    description: 'Product detail retrieved successfully.',
  })
  @ApiResponse({ status: 404, description: 'Product detail not found.' })
  @Public()
  @Get(':id')
  async findOne(@Param('id') id: number) {
    return await this.productDetailsService.findOne(id);
  }

  @ApiOperation({ summary: 'Update a product detail by ID' })
  @ApiResponse({
    status: 200,
    description: 'Product detail updated successfully.',
  })
  @ApiResponse({ status: 404, description: 'Product detail not found.' })
  @Put(':id')
  async update(
    @Param('id') id: number,
    @Body() updateProductDetailDto: UpdateProductDetailDto,
  ) {
    return await this.productDetailsService.update(id, updateProductDetailDto);
  }


  @ApiOperation({ summary: 'Delete a product detail by ID' })
  @ApiResponse({
    status: 200,
    description: 'Product detail deleted successfully.',
  })
  @ApiResponse({ status: 404, description: 'Product detail not found.' })
  @Delete(':id')
  async remove(@Param('id') id: number) {
    return await this.productDetailsService.remove(id);
  }
}
