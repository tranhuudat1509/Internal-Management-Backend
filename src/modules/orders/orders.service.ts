import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';

import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { calculateOrderFinancialSummary } from './helpers/order-financial-summary';
import { DeliveryStatus } from '@prisma/client';

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
      throw new NotFoundException('Customer not found.');
    }

    const orderItems: {
      productId: number;
      quantity: number;
      unitPrice: number;
      lineTotal: number;
    }[] = [];

    for (const item of createOrderDto.items) {
      const product = await this.prisma.product.findUnique({
        where: {
          id: item.productId,
        },
      });

      if (!product) {
        throw new NotFoundException(
          `Product with ID ${item.productId} not found.`,
        );
      }
      orderItems.push({
        productId: product.id,
        quantity: item.quantity,
        unitPrice: product.basePrice,
        lineTotal: item.quantity * product.basePrice,
      });
    }

    const subtotal = orderItems.reduce(
      (sum, item) => sum + item.lineTotal,
      0,
    );

    const total = subtotal - (createOrderDto.discount ?? 0);

    return this.prisma.order.create({
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

        subtotal,

        total,

        items: {
          create: orderItems,
        },
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
  }

  async update(id: number, updateOrderDto: UpdateOrderDto) {

    const existingOrder = await this.prisma.order.findUnique({
      where: {
        id,
      },
    });

    if (!existingOrder) {
      throw new NotFoundException('Order not found.');
    }

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

    return this.prisma.order.update({
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
