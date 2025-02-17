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
  BadRequestException,
  UploadedFiles,
  UseInterceptors,
  Headers,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PaginationDto } from 'src/admin/dto/pagination.dto';
import { AdminGuard } from '../common/guards';
import { Public } from '../common/decorators';
import { FilesInterceptor } from '@nestjs/platform-express';
import { FormDataDto } from './dto/formdata.dto';

/**
 * Helper function for file filtering and size limits
 */
const fileInterceptorOptions = {
  fileFilter: (req, file, callback) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(file.originalname.toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      callback(null, true);
    } else {
      callback(
        new BadRequestException(
          'Faqat rasm formatidagi fayllarni yuklash mumkin (jpeg, jpg, png, gif, webp)!',
        ),
        false,
      );
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // Maksimal fayl hajmi: 5MB
  },
};

@ApiTags('Products')
@Controller('products')
@UseGuards(AdminGuard)
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  /**
   * Create a new product
   */
  @ApiOperation({ summary: 'Create a new product with images' })
  @ApiResponse({ status: 201, description: 'Product created successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid input or file format.' })
  @Post()
  @UseInterceptors(FilesInterceptor('files', 10, fileInterceptorOptions))
  async create(
    @Body() formDataDto: FormDataDto,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) {
    const tags = formDataDto.tags.split(',');
    const color = formDataDto.color.split(',');
    return await this.productService.create(
      { ...formDataDto, tags, color },
      files,
    );
  }

  /**
   * Retrieve all products with optional filtering, sorting, and pagination
   */
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
  async findAll(@Query() query: PaginationDto,@Headers('authorization') authorization?: string) {
     let token = null;
     if (authorization) {
       token = authorization.replace('Bearer ', '').trim();
     }
    return await this.productService.findAll(query,token);
  }

  /**
   * Retrieve a product by ID
   */
  @ApiOperation({ summary: 'Retrieve a product by ID' })
  @ApiResponse({ status: 200, description: 'Product retrieved successfully.' })
  @ApiResponse({ status: 404, description: 'Product not found.' })
  @Public()
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.productService.findOne(+id);
  }

  /**
   * Update a product by ID
   */
  @ApiOperation({ summary: 'Update a product by ID with images' })
  @ApiResponse({ status: 200, description: 'Product updated successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid input or file format.' })
  @ApiResponse({ status: 404, description: 'Product not found.' })
  @Patch(':id')
  @UseInterceptors(FilesInterceptor('files', 10, fileInterceptorOptions))
  async update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) {
    return await this.productService.update(+id, updateProductDto, files);
  }

  /**
   * Delete a product by ID
   */
  @ApiOperation({ summary: 'Delete a product by ID' })
  @ApiResponse({ status: 200, description: 'Product deleted successfully.' })
  @ApiResponse({ status: 404, description: 'Product not found.' })
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return await this.productService.remove(+id);
  }
}
