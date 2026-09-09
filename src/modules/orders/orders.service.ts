import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';

import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { calculateOrderFinancialSummary } from './helpers/order-financial-summary';
import { recalculateOrderTotals } from './helpers/recalculate-order';
import { DeliveryStatus } from '@prisma/client';
import { ensureOrderEditable } from './helpers/ensure-order-editable';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) { }

  async findAll() {
    const orders = await this.prisma.order.findMany({
      include: {
        customer: true,
        items: {
          include: {
            product: true,
          }
        },
        payments: true,
      },
    });

    return orders.map((order) => ({
      ...order,
      financialSummary: calculateOrderFinancialSummary(
        order.total,
        order.payments,
      ),
    }));
  }

  async findOne(id: number) {
    const order = await this.prisma.order.findUnique({
      where: {
        id,
      },

      include: {
        customer: true,

        items: {
          include: {
            product: true,
          },
        },

        payments: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found.');
    }

    const financialSummary = calculateOrderFinancialSummary(
      order.total,
      order.payments,
    );

    return {
      ...order,
      financialSummary,
    };
  }

  async create(createOrderDto: CreateOrderDto) {

    const customer = await this.prisma.customer.findUnique({
      where: {
        id: createOrderDto.customerId,
      },
    });

    if (!customer) {
      throw new NotFoundException(
        'Customer not found.',
      );
    }

    const order = await this.prisma.order.create({
      data: {
        customerId: createOrderDto.customerId,

        orderDate: createOrderDto.orderDate
          ? new Date(createOrderDto.orderDate)
          : undefined,

        deliveryStatus: createOrderDto.delivered
          ? DeliveryStatus.DELIVERED
          : DeliveryStatus.NOT_DELIVERED,

        deliveryDate: createOrderDto.delivered
          ? new Date()
          : null,

        notes: createOrderDto.notes,

        discount: createOrderDto.discount ?? 0,
      },
    });

    return this.findOne(order.id);
  }

  async update(id: number, updateOrderDto: UpdateOrderDto) {

    const existingOrder = await ensureOrderEditable(
      this.prisma,
      id,
    );

    let deliveryStatus = existingOrder.deliveryStatus;
    let deliveryDate = existingOrder.deliveryDate;

    if (updateOrderDto.delivered === true) {
      deliveryStatus = DeliveryStatus.DELIVERED;

      if (existingOrder.deliveryStatus !== DeliveryStatus.DELIVERED) {
        deliveryDate = new Date();
      }
    } else if (updateOrderDto.delivered === false) {
      deliveryStatus = DeliveryStatus.NOT_DELIVERED;
      deliveryDate = null;
    }

    await this.prisma.order.update({
      where: {
        id,
      },

      data: {
        orderDate: updateOrderDto.orderDate
          ? new Date(updateOrderDto.orderDate)
          : undefined,

        deliveryStatus,
        deliveryDate,

        notes: updateOrderDto.notes,
        discount: updateOrderDto.discount,
      },
    });

    await recalculateOrderTotals(
      this.prisma,
      id,
    );

    return this.findOne(id);
  }

  async remove(id: number) {
    const order = await this.prisma.order.findUnique({
      where: {
        id,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found.');
    }

    return this.prisma.order.delete({
      where: {
        id,
      },
    });
  }
}
