import { PrismaService } from '../../../database/prisma.service';

export async function recalculateOrderTotals(
    prisma: PrismaService,
    orderId: number,
) {
    const order = await prisma.order.findUnique({
        where: {
            id: orderId,
        },

        include: {
            items: true,
        },
    });

    if (!order) {
        return;
    }

    const subtotal = order.items.reduce(
        (sum, item) => sum + item.lineTotal,
        0,
    );

    const total = subtotal - (order.discount ?? 0);

    await prisma.order.update({
        where: {
            id: orderId,
        },

        data: {
            subtotal,
            total,
        },
    });
}