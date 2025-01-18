import { Injectable } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { Order } from './models/order.model';
import { InjectModel } from '@nestjs/sequelize';

@Injectable()
export class OrderService {
  constructor(@InjectModel(Order) private orderModel: typeof Order) {}

  async create(createOrderDto: CreateOrderDto) {
    const order = await this.orderModel.create({
      ...createOrderDto, // Statusni DTO dan oladi
      status: createOrderDto.status || 'new', // Agar status berilmagan bo'lsa, 'new' ni o'rnatadi
    });
    return order;
  }

  async findAll(page: number = 1, limit: number = 10, status?: string) {
    const offset = (page - 1) * limit;
    const whereCondition = status ? { status } : {}; // Filter by status if provided

    const { count, rows } = await this.orderModel.findAndCountAll({
      where: whereCondition,
      limit,
      offset,
      include: { all: true },
    });

    return {
      totalOrders: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      data: rows,
    };
  }

  async findOne(id: number) {
    const order = await this.orderModel.findByPk(id, {
      include: { all: true },
    });
    if (!order) {
      throw new Error(`Order with ID ${id} not found`);
    }
    return order;
  }

  async update(id: number, updateOrderDto: UpdateOrderDto) {
    const [rowsUpdated, [updatedOrder]] = await this.orderModel.update(
      updateOrderDto,
      {
        where: { id },
        returning: true,
      },
    );

    if (rowsUpdated === 0) {
      throw new Error(`Order with ID ${id} not found`);
    }

    return updatedOrder;
  }

  async changeStatus(
    id: number,
    newStatus: 'new' | 'in-process' | 'rejected' | 'delivered',
  ) {
    const order = await this.findOne(id);
    order.status = newStatus;
    await order.save();
    return order;
  }
  async remove(id: number) {
    const deletedCount = await this.orderModel.destroy({ where: { id } });
    if (deletedCount === 0) {
      throw new Error(`Order with ID ${id} not found`);
    }
    return { message: `Order with ID ${id} successfully deleted` };
  }
}
