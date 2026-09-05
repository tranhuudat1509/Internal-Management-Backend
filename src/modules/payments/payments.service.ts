import { Injectable } from '@nestjs/common';

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