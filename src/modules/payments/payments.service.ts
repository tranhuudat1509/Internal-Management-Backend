import {
    Injectable,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';

import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';

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
        return this.prisma.payment.findUnique({
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
                    },
                },
            }
        });
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

        const amountPaid = order.payments.reduce(
            (sum, payment) => sum + payment.amount,
            0,
        );

        const remainingBalance = order.total - amountPaid;

        if (createPaymentDto.amount > remainingBalance) {
            throw new BadRequestException(
                'Payment exceeds the remaining balance.',
            );
        }

        return this.prisma.payment.create({
            data: {
                orderId: createPaymentDto.orderId,

                amount: createPaymentDto.amount,

                paymentMethod: createPaymentDto.paymentMethod,

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
        return this.prisma.payment.update({
            where: {
                id,
            },

            data: {
                amount: updatePaymentDto.amount,
                paymentMethod: updatePaymentDto.paymentMethod,
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
        return this.prisma.payment.delete({
            where: {
                id,
            },
        });
    }
}