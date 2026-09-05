import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';

import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) { }

  async findAll() {
    return this.prisma.order.findMany({
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
  }

  async findOne(id: number) {
    return this.prisma.order.findUnique({
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
    return this.prisma.order.create({
      data: {
        customerId: createOrderDto.customerId,

        notes: createOrderDto.notes,

        discount: createOrderDto.discount ?? 0,

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
    return this.prisma.order.update({
      where: {
        id,
      },

      data: {
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
    return this.prisma.order.delete({
      where: {
        id,
      },
    });
  }
}
