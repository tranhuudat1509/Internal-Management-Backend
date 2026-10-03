import {
    Injectable,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common';

import {
    OrderStatus,
} from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';

import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';

@Injectable()
export class PaymentsService {
    constructor(private prisma: PrismaService) { }

    private async getCustomerFinancialSummary(
        customerId: number,
        excludePaymentId?: number,
    ) {
        const customer = await this.prisma.customer.findUnique({
            where: {
                id: customerId,
            },
        });

        if (!customer) {
            throw new NotFoundException('Customer not found.');
        }

        const [ordersResult, paymentsResult] = await Promise.all([
            this.prisma.order.aggregate({
                where: {
                    customerId,

                    status: {
                        not: OrderStatus.CANCELLED,
                    },
                },

                _sum: {
                    total: true,
                },
            }),

            this.prisma.payment.aggregate({
                where: {
                    customerId,

                    ...(excludePaymentId !== undefined
                        ? {
                            id: {
                                not: excludePaymentId,
                            },
                        }
                        : {}),
                },

                _sum: {
                    amount: true,
                },
            }),
        ]);

        const totalOrders =
            ordersResult._sum.total ?? 0;

        const totalPayments =
            paymentsResult._sum.amount ?? 0;

        const outstandingBalance =
            Math.max(
                0,
                totalOrders - totalPayments,
            );

        return {
            totalOrders,
            totalPayments,
            outstandingBalance,
        };
    }

    async findAll() {
        return this.prisma.payment.findMany({
            include: {
                customer: true,

                // Legacy v1.0 relationship only.
                order: {
                    include: {
                        customer: true,
                    },
                },
            },

            orderBy: {
                paymentDate: 'desc',
            },
        });
    }

    async findOne(id: number) {
        const payment =
            await this.prisma.payment.findUnique({
                where: {
                    id,
                },

                include: {
                    customer: true,

                    // May exist for old v1.0 payments.
                    order: {
                        include: {
                            customer: true,

                            items: {
                                include: {
                                    product: true,
                                },
                            },
                        },
                    },
                },
            });

        if (!payment) {
            throw new NotFoundException(
                'Payment not found.',
            );
        }

        const financialSummary =
            await this.getCustomerFinancialSummary(
                payment.customerId,
            );

        return {
            ...payment,
            customerFinancialSummary:
                financialSummary,
        };
    }

    async create(
        createPaymentDto: CreatePaymentDto,
    ) {
        const financialSummary =
            await this.getCustomerFinancialSummary(
                createPaymentDto.customerId,
            );

        if (
            createPaymentDto.amount >
            financialSummary.outstandingBalance
        ) {
            throw new BadRequestException(
                'Payment exceeds the customer outstanding balance.',
            );
        }

        return this.prisma.payment.create({
            data: {
                customerId:
                    createPaymentDto.customerId,

                // New v1.2 payments are not allocated
                // to individual orders.
                orderId: null,

                amount:
                    createPaymentDto.amount,

                paymentMethod:
                    createPaymentDto.paymentMethod,

                paymentDate:
                    createPaymentDto.paymentDate
                        ? new Date(
                            createPaymentDto.paymentDate,
                        )
                        : undefined,

                notes:
                    createPaymentDto.notes,
            },

            include: {
                customer: true,
                order: true,
            },
        });
    }

    async update(
        id: number,
        updatePaymentDto: UpdatePaymentDto,
    ) {
        const existingPayment =
            await this.prisma.payment.findUnique({
                where: {
                    id,
                },
            });

        if (!existingPayment) {
            throw new NotFoundException(
                'Payment not found.',
            );
        }

        const customerId =
            updatePaymentDto.customerId ??
            existingPayment.customerId;

        const newAmount =
            updatePaymentDto.amount ??
            existingPayment.amount;

        const financialSummary =
            await this.getCustomerFinancialSummary(
                customerId,
                id,
            );

        if (
            newAmount >
            financialSummary.outstandingBalance
        ) {
            throw new BadRequestException(
                'Payment exceeds the customer outstanding balance.',
            );
        }

        return this.prisma.payment.update({
            where: {
                id,
            },

            data: {
                customerId:
                    updatePaymentDto.customerId,

                amount:
                    updatePaymentDto.amount,

                paymentMethod:
                    updatePaymentDto.paymentMethod,

                paymentDate:
                    updatePaymentDto.paymentDate
                        ? new Date(
                            updatePaymentDto.paymentDate,
                        )
                        : undefined,

                notes:
                    updatePaymentDto.notes,
            },

            include: {
                customer: true,
                order: true,
            },
        });
    }

    async remove(id: number) {
        const payment =
            await this.prisma.payment.findUnique({
                where: {
                    id,
                },
            });

        if (!payment) {
            throw new NotFoundException(
                'Payment not found.',
            );
        }

        return this.prisma.payment.delete({
            where: {
                id,
            },
        });
    }
}