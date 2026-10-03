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

    const discount = order.discount ?? 0;
    const taxRate = order.taxRate ?? 0;

    const amountBeforeTax = Math.max(
        subtotal - discount,
        0,
    );

    const taxAmount = Math.round(
        amountBeforeTax * (taxRate / 100),
    );

    const total =
        amountBeforeTax + taxAmount;

    await prisma.order.update({
        where: {
            id: orderId,
        },

        data: {
            subtotal,
            taxAmount,
            total,
        },
    });
}