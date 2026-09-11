import { NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../../database/prisma.service';

export async function getOrderWithDetails(
    prisma: PrismaService,
    id: number,
) {
    const order = await prisma.order.findUnique({

        where: {
            id,
        },

        include: {

            customer: true,

            items: {
                include: {
                    product: true,
                },
            },

            payments: true,

        },

    });

    if (!order) {
        throw new NotFoundException(
            'Order not found.',
        );
    }

    return order;
}