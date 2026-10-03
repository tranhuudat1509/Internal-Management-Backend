import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class DashboardService {
    constructor(
        private prisma: PrismaService,
    ) { }

    async getDashboard() {
        const [
            totalCustomers,
            totalProducts,
            totalOrders,
            activeOrders,
            recentOrders,
            recentPayments,
            customers,
        ] = await Promise.all([
            this.prisma.customer.count(),

            this.prisma.product.count(),

            this.prisma.order.count(),

            this.prisma.order.count({
                where: {
                    status: 'IN_PROGRESS',
                },
            }),

            this.prisma.order.findMany({
                take: 5,

                orderBy: {
                    orderDate: 'desc',
                },

                include: {
                    customer: true,
                },
            }),

            this.prisma.payment.findMany({
                take: 5,

                orderBy: {
                    paymentDate: 'desc',
                },

                include: {
                    customer: true,
                },
            }),

            this.prisma.customer.findMany({
                include: {
                    orders: {
                        where: {
                            status: {
                                not: 'CANCELLED',
                            },
                        },
                    },

                    payments: true,
                },
            }),
        ]);

        const customerBalances =
            customers.map((customer) => {
                const totalOrders =
                    customer.orders.reduce(
                        (sum, order) =>
                            sum + order.total,
                        0,
                    );

                const totalPayments =
                    customer.payments.reduce(
                        (sum, payment) =>
                            sum + payment.amount,
                        0,
                    );

                const outstandingBalance =
                    Math.max(
                        0,
                        totalOrders - totalPayments,
                    );

                return {
                    customerId: customer.id,
                    companyName: customer.companyName,
                    totalOrders,
                    totalPayments,
                    outstandingBalance,
                };
            });

        const outstandingBalance =
            customerBalances.reduce(
                (sum, customer) =>
                    sum +
                    customer.outstandingBalance,
                0,
            );

        const recentOrdersSummary =
            recentOrders.map((order) => ({
                id: order.id,

                customer:
                    order.customer.companyName,

                status: order.status,

                orderDate: order.orderDate,

                total: order.total,
            }));

        const recentPaymentsSummary =
            recentPayments.map((payment) => ({
                id: payment.id,

                customer:
                    payment.customer.companyName,

                paymentDate:
                    payment.paymentDate,

                amount:
                    payment.amount,

                paymentMethod:
                    payment.paymentMethod,
            }));

        const topDebtors =
            customerBalances
                .filter(
                    (customer) =>
                        customer.outstandingBalance > 0,
                )
                .sort(
                    (a, b) =>
                        b.outstandingBalance -
                        a.outstandingBalance,
                )
                .slice(0, 5);

        return {
            summary: {
                totalCustomers,

                totalProducts,

                totalOrders,

                activeOrders,

                outstandingBalance,
            },

            recentOrders:
                recentOrdersSummary,

            recentPayments:
                recentPaymentsSummary,

            topDebtors,
        };
    }
}