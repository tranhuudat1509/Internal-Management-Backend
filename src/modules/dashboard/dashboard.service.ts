import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';
import { calculateOrderFinancialSummary }
    from '../orders/helpers/order-financial-summary';

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

            orders,

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

                where: {
                    status: {
                        not: 'CANCELLED',
                    },
                },

                include: {
                    payments: true,
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
                    order: {
                        include: {
                            customer: true,
                        },
                    },
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

                        include: {
                            payments: true,
                        },

                    },

                },

            }),

        ]);

        let outstandingBalance = 0;

        for (const order of orders) {

            const financialSummary =
                calculateOrderFinancialSummary(
                    order.total,
                    order.payments,
                );

            outstandingBalance +=
                financialSummary.remainingBalance;

        }

        const recentOrdersSummary =
            recentOrders.map((order) => ({

                id: order.id,

                customer: order.customer.companyName,

                status: order.status,

                orderDate: order.orderDate,

                total: order.total,

            }));

        const recentPaymentsSummary =
            recentPayments.map((payment) => ({

                id: payment.id,

                customer: payment.order.customer.companyName,

                paymentDate: payment.paymentDate,

                amount: payment.amount,

                paymentMethod: payment.paymentMethod,

            }));

        const topDebtors =
            customers
                .map((customer) => {

                    let outstandingBalance = 0;

                    for (const order of customer.orders) {

                        const financialSummary =
                            calculateOrderFinancialSummary(
                                order.total,
                                order.payments,
                            );

                        outstandingBalance +=
                            financialSummary.remainingBalance;
                    }

                    return {

                        customerId: customer.id,

                        companyName: customer.companyName,

                        outstandingBalance,

                    };

                })
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

            recentOrders: recentOrdersSummary,

            recentPayments: recentPaymentsSummary,

            topDebtors,
        };

    }

}