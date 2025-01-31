import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Order } from './models/order.model';
import { Customer } from '../customer/models/customer.model';
import { Product } from '../product/models/product.model';
import { OrderItemService } from '../order_item/order_item.service';
import { OrderAddressService } from '../order_address/order_address.service';
import { OrderDto } from './dto/order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { PaginationDto } from '../admin/dto/pagination.dto';
import { FindAndCountOptions } from 'sequelize';
import { OrderAddress } from '../order_address/models/order_address.model';
import { OrderItem } from '../order_item/models/order_item.model';
import { Op } from 'sequelize';

@Injectable()
export class OrderService {
  constructor(
    @InjectModel(Order) private orderModel: typeof Order,
    @InjectModel(Product) private productModel: typeof Product,
    @InjectModel(Customer) private customerModel: typeof Customer,
    private readonly orderItemService: OrderItemService,
    private readonly orderAddressService: OrderAddressService,
  ) {}

  async create(orderDto: OrderDto) {
    const { address, customerId, order_details, total_price } = orderDto;

    const customer = await this.customerModel.findByPk(customerId);
    if (!customer) {
      throw new NotFoundException(`Customer with id ${customerId} not found`);
    }

    const new_address = await this.orderAddressService.create({
      ...address,
      customerId,
    });

    if (!new_address) {
      throw new BadRequestException('Error on creating address');
    }

    for (const order_detail of order_details) {
      const product = await this.productModel.findByPk(order_detail.productId);

      if (!product) {
        throw new NotFoundException(
          `Product with id ${order_detail.productId} not found`,
        );
      }

      if (product.stock < order_detail.quantity) {
        throw new BadRequestException(
          `Not enough stock for product: ${product.title} (Available: ${product.stock}, Requested: ${order_detail.quantity})`,
        );
      }
    }

    const order = await this.orderModel.create({
      customerId,
      order_addressId: new_address.id,
      total_price: Number(total_price),
    });

    if (!order) {
      throw new BadRequestException('Error on creating order');
    }

    const new_order_details = await Promise.all(
      order_details.map(async (order_detail) => {
        return this.orderItemService.create({
          ...order_detail,
          orderId: order.id,
        });
      }),
    );

    if (!new_order_details) {
      throw new BadRequestException('Error on creating order details');
    }

    return { order, new_address, order_details: new_order_details };
  }

  async findAll(paginationDto: PaginationDto) {
    const {
      filter,
      order = 'asc',
      page = 1,
      limit = 10,
      minPrice,
      maxPrice,
      sortBy = 'createdAt',
      categoryId,
    } = paginationDto;

    const where: any = {};

    if (filter) {
      where[Op.or] = [
        { title: { [Op.like]: `%${filter}%` } },
        { description: { [Op.like]: `%${filter}%` } },
      ];
    }

    if (minPrice !== undefined) {
      where.price = { ...where.price, [Op.gte]: minPrice };
    }

    if (maxPrice !== undefined) {
      where.price = { ...where.price, [Op.lte]: maxPrice };
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    const orders: [string, string][] = [[sortBy, order]];

    const offset = (page - 1) * limit;

    const { rows, count } = await this.orderModel.findAndCountAll({
      where,
      order: orders,
      limit,
      offset,
      include: [
        Customer,
        OrderAddress,
        { model: OrderItem, include: [Product] },
      ],
    });

    return {
      data: rows,
      total: count,
      page,
      limit,
    };
  }

  async findOne(id: number) {
    const order = await this.orderModel.findByPk(id, {
      include: [
        {
          model: Customer,
          attributes: ['first_name', 'last_name', 'phone_number', 'email'],
        },
        {
          association: 'order_address',
          attributes: [
            'region',
            'city',
            'street',
            'zip_code',
            'house_number',
            'phone',
          ],
        },
        {
          association: 'order_items',
          include: [
            {
              model: Product,
              attributes: ['title', 'price'],
            },
          ],
          attributes: ['quantity', 'productId'],
        },
      ],
    });

    if (!order) {
      throw new NotFoundException(`Order with id ${id} not found`);
    }

    return {
      statusCode: 200,
      message: `Order with id ${id} retrieved successfully`,
      data: order,
    };
  }

  async update(id: number, updateOrderDto: UpdateOrderDto) {
    const [numberOfAffectedRows, [updatedOrder]] = await this.orderModel.update(
      updateOrderDto,
      {
        where: { id },
        returning: true,
      },
    );

    if (numberOfAffectedRows === 0) {
      throw new NotFoundException(`Order with id ${id} not found`);
    }

    return {
      statusCode: 200,
      message: 'Order updated successfully',
      data: updatedOrder,
    };
  }

  async remove(id: number) {
    const numberOfDeletedRows = await this.orderModel.destroy({
      where: { id },
    });

    if (numberOfDeletedRows === 0) {
      throw new NotFoundException(`Order with id ${id} not found`);
    }

    return {
      statusCode: 200,
      message: `Order with id ${id} removed successfully`,
    };
  }
}
