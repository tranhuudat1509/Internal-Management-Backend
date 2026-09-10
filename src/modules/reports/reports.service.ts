import { Injectable } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class ReportsService {
  constructor(
    private prisma: PrismaService,
  ) { }

  async getSalesSummary() {

    const [
      totalOrders,
      statusCounts,
      revenue,
      pendingRevenueAggregate,
    ] = await Promise.all([
      this.prisma.order.count(),

      this.prisma.order.groupBy({
        by: ['status'],
        _count: {
          status: true,
        },
      }),

      this.prisma.order.aggregate({
        _sum: {
          total: true,
        },
      }),

      this.prisma.order.aggregate({
        where: {
          status: OrderStatus.IN_PROGRESS,
        },
        _sum: {
          total: true,
        },
      }),
    ]);

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

    const totalRevenue =
      revenue._sum.total ?? 0;

    const averageOrderValue =
      totalOrders === 0
        ? 0
        : totalRevenue / totalOrders;

    const totalPendingRevenue =
      pendingRevenueAggregate._sum.total ?? 0;

    return {
      totalOrders,
      deliveredOrders,
      inProgressOrders,
      cancelledOrders,
      totalRevenue,
      averageOrderValue,
      totalPendingRevenue,
    };
  }
}