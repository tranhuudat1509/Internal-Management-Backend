import {
    BadRequestException,
    NotFoundException,
} from '@nestjs/common';

import { DeliveryStatus } from '@prisma/client';

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

    if (order.deliveryStatus === DeliveryStatus.DELIVERED) {
        throw new BadRequestException(
            'Delivered orders cannot be modified.',
        );
    }

    return order;
}