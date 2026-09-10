import {
    BadRequestException,
    NotFoundException,
} from '@nestjs/common';

import { OrderStatus } from '@prisma/client';

import { PrismaService } from '../../../database/prisma.service';

export async function ensureOrderEditable(
    prisma: PrismaService,
    orderId: number,
) {
    const order = await prisma.order.findUnique({
        where: {
            id: orderId,
        },
    });

    if (!order) {
        throw new NotFoundException(
            'Order not found.',
        );
    }

    if (
        order.status === OrderStatus.DELIVERED ||
        order.status === OrderStatus.CANCELLED
    ) {
        throw new BadRequestException(
            'Delivered or cancelled orders cannot be modified.',
        );
    }

    return order;
}