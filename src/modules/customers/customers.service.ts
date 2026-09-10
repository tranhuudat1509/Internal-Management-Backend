import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { OrderStatus } from '@prisma/client';

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) { }

  async findAll() {
    return this.prisma.customer.findMany({
      include: {
        contacts: true,
      },
    });
  }

  async findOne(id: number) {
    const customer = await this.prisma.customer.findUnique({
      where: {
        id,
      },

      include: {
        contacts: true,
      },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found.');
    }

    return customer;
  }

  async update(id: number, updateCustomerDto: UpdateCustomerDto) {
    const customer = await this.prisma.customer.findUnique({
      where: {
        id,
      },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found.');
    }

    return this.prisma.customer.update({
      where: {
        id,
      },

      data: {
        companyName: updateCustomerDto.companyName,
        city: updateCustomerDto.city,
        address: updateCustomerDto.address,
        notes: updateCustomerDto.notes,
        isActive: updateCustomerDto.isActive,
      },

      include: {
        contacts: true,
      },
    });
  }

  async remove(id: number) {
    const customer = await this.prisma.customer.findUnique({
      where: {
        id,
      },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found.');
    }

    return this.prisma.customer.delete({
      where: {
        id,
      },
    });
  }

  async create(createCustomerDto: CreateCustomerDto) {
    return this.prisma.customer.create({
      data: {
        companyName: createCustomerDto.companyName,
        city: createCustomerDto.city,
        address: createCustomerDto.address,
        notes: createCustomerDto.notes,
        isActive: createCustomerDto.isActive ?? true,

        contacts: {
          create: createCustomerDto.contacts,
        },
      },

      include: {
        contacts: true,
      },
    });
  }

  async getProfile(id: number) {

    const [
      customer,
      totalOrders,
      statusCounts,
      revenueAggregate,
      lastOrder,
      lastDelivery,
      recentOrders,
      outstandingOrders,
      paymentHistory,
    ] = await Promise.all([

      this.prisma.customer.findUnique({
        where: { id },
        include: {
          contacts: true,
        },
      }),

      this.prisma.order.count({
        where: {
          customerId: id,
        },
      }),

      this.prisma.order.groupBy({
        by: ['status'],
        where: {
          customerId: id,
        },
        _count: {
          status: true,
        },
      }),

      this.prisma.order.aggregate({
        where: {
          customerId: id,
        },
        _sum: {
          total: true,
        },
      }),

      this.prisma.order.findFirst({
        where: {
          customerId: id,
        },
        orderBy: {
          orderDate: 'desc',
        },
      }),

      this.prisma.order.findFirst({
        where: {
          customerId: id,
          status: OrderStatus.DELIVERED,
        },
        orderBy: {
          deliveryDate: 'desc',
        },
      }),

      this.prisma.order.findMany({
        where: {
          customerId: id,
        },

        orderBy: {
          orderDate: 'desc',
        },

        take: 5,

        select: {
          id: true,
          status: true,
          orderDate: true,
          deliveryDate: true,
          subtotal: true,
          discount: true,
          total: true,
        },
      }),

      this.prisma.order.findMany({
        where: {
          customerId: id,
          status: {
            not: OrderStatus.CANCELLED,
          },
        },

        include: {
          payments: true,
        },
      }),

      this.prisma.payment.findMany({
        where: {
          order: {
            customerId: id,
          },
        },

        orderBy: {
          paymentDate: 'desc',
        },

        take: 10,

        select: {
          id: true,
          amount: true,
          paymentDate: true,
          paymentMethod: true,

          order: {
            select: {
              id: true,
            },
          },
        },
      }),

    ]);

    if (!customer) {
      throw new NotFoundException(
        'Customer not found.',
      );
    }

    const deliveredOrders =
      statusCounts.find(
        (statusCount) =>
          statusCount.status === OrderStatus.DELIVERED,
      )?._count.status ?? 0;

    const inProgressOrders =
      statusCounts.find(
        (statusCount) =>
          statusCount.status === OrderStatus.IN_PROGRESS,
      )?._count.status ?? 0;

    const cancelledOrders =
      statusCounts.find(
        (statusCount) =>
          statusCount.status === OrderStatus.CANCELLED,
      )?._count.status ?? 0;

    const totalSpent =
      revenueAggregate._sum.total ?? 0;

    const outstandingBalance =
      outstandingOrders.reduce(
        (sum, order) => {

          const paid =
            order.payments.reduce(
              (paymentSum, payment) =>
                paymentSum + payment.amount,
              0,
            );

          return sum + (order.total - paid);

        },
        0,
      );

    return {

      customer,

      summary: {

        totalOrders,

        deliveredOrders,

        inProgressOrders,

        cancelledOrders,

        totalSpent,

        outstandingBalance,

        lastOrderDate:
          lastOrder?.orderDate ?? null,

        lastDeliveryDate:
          lastDelivery?.deliveryDate ?? null,

      },

      recentOrders,

      paymentHistory,

    };
  }
}
