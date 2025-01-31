import { ApiProperty } from '@nestjs/swagger';
import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  HasMany,
  Model,
  Table,
} from 'sequelize-typescript';
import { ProductCategory } from 'src/product_category/models/product_category.model';
import { ProductRating } from '../../product_rating/models/product_rating.model';
import { ProductComment } from '../../product_comment/models/product_comment.model';

interface IProductCreationAttr {
  title: string;
  categoryId: number;
  description?: string;
  origin_price?: number;
  price: number;
  image: string[];
  color: string[];
  stock?: number;
  average_rating: number;
  sku: string;
  additional_info: string;
  tags: string[];
  is_liked?: boolean;
}

@Table({ tableName: 'product', timestamps: true })
export class Product extends Model<Product, IProductCreationAttr> {
  @ApiProperty({
    example: 1,
    description: 'Product ID',
  })
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  })
  id: number;

  @ApiProperty({
    example: 'Furniture',
    description: 'Name of the product',
  })
  @Column({
    type: DataType.STRING(100),
    allowNull: false,
  })
  title: string;

  @ApiProperty({
    example: 1,
    description: 'Category ID of the product',
  })
  @ForeignKey(() => ProductCategory)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  categoryId: number;

  @ApiProperty({
    example: 'About furniture',
    description: 'Description of the product',
  })
  @Column({
    type: DataType.STRING(1000),
    allowNull: true,
  })
  description: string;

  @ApiProperty({
    example: 1200,
    description: 'Original price of the product',
  })
  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: true,
  })
  origin_price: number;

  @ApiProperty({
    example: 1000,
    description: 'Price of the product',
  })
  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
  })
  get price(): number {
    const rawValue = this.getDataValue('price');
    // Agar qiymat number bo'lsa, to'g'ridan-to'g'ri qaytariladi
    return typeof rawValue === 'number' ? rawValue : parseFloat(rawValue);
  }

  @ApiProperty({
    example: [
      'https://www.example.com/image1.png',
      'https://www.example.com/image2.png',
    ],
    description: 'Array of product images',
  })
  @Column({
    type: DataType.ARRAY(DataType.STRING),
    allowNull: true,
  })
  image: string[];

  @ApiProperty({
    example: ['white', 'black'],
    description: 'Array of product colors',
  })
  @Column({
    type: DataType.ARRAY(DataType.STRING),
    allowNull: true,
  })
  color: string[];

  @ApiProperty({
    example: 10,
    description: 'Stock of the product',
  })
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    defaultValue: 0,
  })
  stock: number;

  @ApiProperty({
    example: 4.5,
    description: 'Average rating of the product',
  })
  @Column({
    type: DataType.DECIMAL(2, 1),
    allowNull: false,
    defaultValue: 0.0,
  })
  get average_rating(): number {
    const rawValue = this.getDataValue('average_rating');
    // Agar qiymat number bo'lsa, to'g'ridan-to'g'ri qaytariladi
    return typeof rawValue === 'number' ? rawValue : parseFloat(rawValue);
  }

  @ApiProperty({
    example: 10,
    description: 'Mahsulot chegirma foizi (0 dan 100 gacha)',
  })
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0,
      max: 100,
    },
  })
  discount: number;

  @ApiProperty({
    example: 'SKU001',
    description: 'SKU of the product',
  })
  @Column({
    type: DataType.STRING(50),
    allowNull: false,
    unique: true,
  })
  sku: string;

  @ApiProperty({
    example: 'Additional information about the product',
    description: 'Additional info of the product',
  })
  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  additional_info: string;

  @ApiProperty({
    example: ['furniture', 'modern', 'white'],
    description: 'Array of product tags',
  })
  @Column({
    type: DataType.ARRAY(DataType.STRING),
    allowNull: true,
  })
  tags: string[];

  @Column({ type: 'boolean', defaultValue: false })
  is_liked: boolean;

  @BelongsTo(() => ProductCategory)
  product_category: ProductCategory;

  @HasMany(() => ProductRating)
  product_ratings: ProductRating[];

  @HasMany(() => ProductComment)
  product_comments: ProductComment[];
}
