import {
    Injectable,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';

import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { calculateOrderFinancialSummary } from '../orders/helpers/order-financial-summary';

@Injectable()
export class PaymentsService {

    constructor(private prisma: PrismaService) { }

    async findAll() {
        return this.prisma.payment.findMany({
            include: {
                order: {
                    include: {
                        customer: true,
                    },
                },
            }
        })
    }

    async findOne(id: number) {
        const payment = await this.prisma.payment.findUnique({
            where: {
                id,
            },

            include: {
                order: {
                    include: {
                        customer: true,

                        items: {
                            include: {
                                product: true,
                            },
                        },

                        payments: true,
                    },
                },
            },
        });

        if (!payment) {
            throw new NotFoundException('Payment not found.');
        }

        return payment;
    }

    async create(createPaymentDto: CreatePaymentDto) {

        const order = await this.prisma.order.findUnique({
            where: {
                id: createPaymentDto.orderId,
            },

            include: {
                payments: true,
            },
        });

        if (!order) {
            throw new NotFoundException('Order not found.');
        }

        const financialSummary =
            calculateOrderFinancialSummary(
                order.total,
                order.payments,
            );

        if (
            createPaymentDto.amount >
            financialSummary.remainingBalance
        ) {
            throw new BadRequestException(
                'Payment exceeds the remaining balance.',
            );
        }

        return this.prisma.payment.create({
            data: {
                orderId: createPaymentDto.orderId,

                amount: createPaymentDto.amount,

                paymentMethod: createPaymentDto.paymentMethod,

                paymentDate: createPaymentDto.paymentDate
                    ? new Date(createPaymentDto.paymentDate)
                    : undefined,

                notes: createPaymentDto.notes,
            },

            include: {
                order: {
                    include: {
                        customer: true,
                    },
                },
            }
        });
    }

    async update(id: number, updatePaymentDto: UpdatePaymentDto) {

        const existingPayment = await this.prisma.payment.findUnique({
            where: {
                id,
            },
        });

        if (!existingPayment) {
            throw new NotFoundException('Payment not found.');
        }

        const order = await this.prisma.order.findUnique({
            where: {
                id: existingPayment.orderId,
            },

            include: {
                payments: true,
            },
        });

        if (!order) {
            throw new NotFoundException('Order not found.');
        }

        const paymentsExcludingCurrent =
            order.payments.filter(
                payment => payment.id !== id,
            );

        const financialSummary =
            calculateOrderFinancialSummary(
                order.total,
                paymentsExcludingCurrent,
            );

        const newAmount =
            updatePaymentDto.amount ??
            existingPayment.amount;

        if (
            newAmount >
            financialSummary.remainingBalance
        ) {
            throw new BadRequestException(
                'Payment exceeds the remaining balance.',
            );
        }

        return this.prisma.payment.update({
            where: {
                id,
            },

            data: {
                amount: updatePaymentDto.amount,

                paymentMethod: updatePaymentDto.paymentMethod,

                paymentDate: updatePaymentDto.paymentDate
                    ? new Date(updatePaymentDto.paymentDate)
                    : undefined,

                notes: updatePaymentDto.notes,
            },

            include: {
                order: {
                    include: {
                        customer: true,
                    },
                },
            },
        });
    }

    async remove(id: number) {
        const payment = await this.prisma.payment.findUnique({
            where: {
                id,
            },
        });

        if (!payment) {
            throw new NotFoundException('Payment not found.');
        }

        return this.prisma.payment.delete({
            where: {
                id,
            },
        });
    }
}