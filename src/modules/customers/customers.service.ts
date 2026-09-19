import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { OrderStatus } from '@prisma/client';
import { calculateOrderFinancialSummary } from '../orders/helpers/order-financial-summary';

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

  async update(
    id: number,
    updateCustomerDto: UpdateCustomerDto,
  ) {

    const customer =
      await this.prisma.customer.findUnique({
        where: { id },
      });

    if (!customer) {
      throw new NotFoundException(
        'Customer not found.',
      );
    }

    console.log(updateCustomerDto);
    console.log(updateCustomerDto.contacts);

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

        contacts: {

          deleteMany: {},

          create:
            updateCustomerDto.contacts ?? [],

        },

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

      favoriteProducts,

      negotiatedPrices,

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


      this.prisma.orderItem.findMany({
        where: {
          order: {
            customerId: id,
          },
        },

        include: {
          product: {
            select: {
              id: true,
              code: true,
              name: true,
              unit: true,
            },
          },
        },
      }),

      this.prisma.customerProductPrice.findMany({
        where: {
          customerId: id,
        },

        select: {
          productId: true,
          price: true,

          product: {
            select: {
              code: true,
              name: true,
              basePrice: true,
              unit: true,
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

    const accountsReceivable =
      outstandingOrders
        .map((order) => {

          const financialSummary =
            calculateOrderFinancialSummary(
              order.total,
              order.payments,
            );

          return {

            orderId: order.id,

            orderDate: order.orderDate,

            deliveryDate: order.deliveryDate,

            status: order.status,

            total: order.total,

            amountPaid:
              financialSummary.amountPaid,

            remainingBalance:
              financialSummary.remainingBalance,

            paymentStatus:
              financialSummary.paymentStatus,

          };

        })
        .filter(
          (order) =>
            order.remainingBalance > 0,
        );

    const outstandingBalance =
      accountsReceivable.reduce(
        (sum, order) =>
          sum + order.remainingBalance,
        0,
      );

    const favoriteProductsSummary =
      Object.values(

        favoriteProducts.reduce((acc, item) => {

          const productId = item.product.id;

          if (!acc[productId]) {

            acc[productId] = {

              productId,

              code: item.product.code,

              name: item.product.name,

              unit: item.product.unit,

              timesPurchased: 0,

              totalQuantity: 0,

            };

          }

          acc[productId].timesPurchased += 1;

          acc[productId].totalQuantity += item.quantity;

          return acc;

        }, {} as Record<number, {

          productId: number;

          code: string;

          name: string;

          unit: string;

          timesPurchased: number;

          totalQuantity: number;

        }>),
      );

    favoriteProductsSummary.sort(
      (a, b) =>
        b.totalQuantity - a.totalQuantity,
    );

    const negotiatedPricesSummary =
      negotiatedPrices.map((price) => ({

        productId: price.productId,

        code: price.product.code,

        name: price.product.name,

        unit: price.product.unit,

        basePrice: price.product.basePrice,

        customerPrice: price.price,

        discountAmount:
          price.product.basePrice - price.price,

      }));

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

      accountsReceivable,

      favoriteProducts:
        favoriteProductsSummary,

      negotiatedPrices:
        negotiatedPricesSummary,
    };
  }

  async getLedger(id: number) {

    const [

      customer,

      orders,

      payments,

    ] = await Promise.all([

      this.prisma.customer.findUnique({
        where: {
          id,
        },

        include: {
          contacts: true,
        },
      }),

      this.prisma.order.findMany({
        where: {
          customerId: id,
        },

        orderBy: {
          orderDate: 'asc',
        },
      }),

      this.prisma.payment.findMany({
        where: {
          order: {
            customerId: id,
          },
        },

        include: {
          order: {
            select: {
              id: true,
            },
          },
        },

        orderBy: {
          paymentDate: 'asc',
        },
      }),

    ]);

    if (!customer) {
      throw new NotFoundException(
        'Customer not found.',
      );
    }

    const ledger: {
      date: Date;
      type: 'ORDER' | 'PAYMENT';
      status: OrderStatus | null;
      orderId: number;
      paymentId: number | null;
      description: string;
      debit: number;
      credit: number;
      balance: number;
    }[] = [];
    for (const order of orders) {
      ledger.push({
        date: order.orderDate,
        type: 'ORDER',
        status: order.status,
        orderId: order.id,
        paymentId: null,
        description: `Đơn hàng #${order.id}`,
        debit: order.total,
        credit: 0,
        balance: 0,
      });
    }

    for (const payment of payments) {
      ledger.push({
        date: payment.paymentDate,
        type: 'PAYMENT',
        status: null,
        orderId: payment.order.id,
        paymentId: payment.id,
        description: `Thanh toán HĐ #${payment.order.id}`,
        debit: 0,
        credit: payment.amount,
        balance: 0,
      });
    }

    ledger.sort(
      (a, b) =>
        new Date(a.date).getTime() -
        new Date(b.date).getTime(),
    );

    let runningBalance = 0;

    for (const entry of ledger) {
      runningBalance += entry.debit;
      runningBalance -= entry.credit;

      entry.balance = runningBalance;
    }

    return {
      customer,

      summary: {
        currentBalance: runningBalance,
        totalTransactions: ledger.length,
      },

      ledger,
    };

  }
}
