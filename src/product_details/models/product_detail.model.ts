import { ApiProperty } from '@nestjs/swagger';
import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import { ProductCategory } from 'src/product_category/models/product_category.model';

export interface IProductDetailCreationArrt {
  productId: number;
  width?: number;
  height?: number;
  depth?: number;
  weight?: number;
  model_number?: string;
  material?: string;
  configuration?: string;
  upholstery_material?: string;
  filling_material?: string;
  max_load_capacity?: number;
  origin_country?: string;
  warranty_summary: string;
}

@Table({ tableName: 'product_details', timestamps: false })
export class ProductDetail extends Model<
  ProductDetail,
  IProductDetailCreationArrt
> {
  @ApiProperty({ example: 1, description: 'Detail ID (Primary Key)' })
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  })
  id: number;

  @ApiProperty({
    example: 1,
    description: 'Product ID to which the details belong',
  })
  @ForeignKey(() => ProductCategory)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  productId: number;

  @ApiProperty({ example: 50.5, description: 'Width of the product (in cm)' })
  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: true,
  })
  width: number;

  @ApiProperty({ example: 120.3, description: 'Height of the product (in cm)' })
  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: true,
  })
  height: number;

  @ApiProperty({ example: 40.0, description: 'Depth of the product (in cm)' })
  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: true,
  })
  depth: number;

  @ApiProperty({ example: 10.5, description: 'Weight of the product (in kg)' })
  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: true,
  })
  weight: number;

  @ApiProperty({
    example: 'MDL123',
    description: 'Model number of the product',
  })
  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  model_number: string;

  @ApiProperty({
    example: 'Wood',
    description: 'Material used for the product',
  })
  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  material: string;

  @ApiProperty({
    example: 'Single Seater',
    description: 'Configuration of the product',
  })
  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  configuration: string;

  @ApiProperty({
    example: 'Leather',
    description: 'Upholstery material of the product',
  })
  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  upholstery_material: string;

  @ApiProperty({
    example: 'Foam',
    description: 'Filling material of the product',
  })
  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  filling_material: string;

  @ApiProperty({
    example: 150,
    description: 'Maximum load capacity of the product (in kg)',
  })
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  max_load_capacity: number;

  @ApiProperty({
    example: 'India',
    description: 'Country of origin for the product',
  })
  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  origin_country: string;

  @ApiProperty({
    example: '2 years warranty',
    description: 'Summary of the product warranty',
  })
  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  warranty_summary: string;

  // Add other relevant fields and relationships here
  @BelongsTo(() => ProductCategory)
  product_category: ProductCategory;
}
