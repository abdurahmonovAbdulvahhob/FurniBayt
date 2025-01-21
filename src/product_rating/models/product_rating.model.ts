import { ApiProperty } from '@nestjs/swagger';
import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import { Product } from '../../product/models/product.model';
import { Customer } from '../../customer/models/customer.model';

interface IProductRatingCreationAttr {
  productId: number;
  customerId: number;
  rating: number;
  comment?: string;
}

@Table({ tableName: 'product_rating', timestamps: true })
export class ProductRating extends Model<
  ProductRating,
  IProductRatingCreationAttr
> {
  @ApiProperty({
    example: 1,
    description: 'Unique ID of the product rating',
  })
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  })
  id: number;

  @ApiProperty({
    example: 1,
    description: 'ID of the product being rated',
  })
  @ForeignKey(() => Product)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  productId: number;

  @ApiProperty({
    example: 1,
    description: 'ID of the customer who gave the rating',
  })
  @ForeignKey(() => Customer)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  customerId: number;

  @ApiProperty({
    example: 4.5,
    description: 'Rating value given by the customer (1.0 to 5.0)',
  })
  @Column({
    type: DataType.DECIMAL(2, 1),
    allowNull: false,
    validate: {
      min: 1.0,
      max: 5.0,
    },
  })
  rating: number;

  @ApiProperty({
    example: 'Great product!',
    description: 'Optional comment provided by the customer',
  })
  @Column({
    type: DataType.TEXT,
    allowNull: true,
    validate: {
      len: [0, 500], // Optional: Limit comment length to 500 characters
    },
  })
  comment?: string;

  @ApiProperty({
    example: '2025-01-17T12:00:00.000Z',
    description: 'Timestamp when the rating was created',
  })
  @Column({
    type: DataType.DATE,
    allowNull: false,
    defaultValue: DataType.NOW,
  })
  createdAt: Date;

  @ApiProperty({
    example: '2025-01-17T13:00:00.000Z',
    description: 'Timestamp when the rating was last updated',
  })
  @Column({
    type: DataType.DATE,
    allowNull: false,
    defaultValue: DataType.NOW,
  })
  updatedAt: Date;

  // Relationships
  @BelongsTo(() => Product)
  product: Product;

  @BelongsTo(() => Customer)
  customer: Customer;
}
