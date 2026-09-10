import { PrismaService } from '../../../database/prisma.service';

export async function getEffectiveProductPrice(
    prisma: PrismaService,
    customerId: number,
    productId: number,
) {
    const product = await prisma.product.findUnique({
        where: {
            id: productId,
        },
    });

    if (!product) {
        return null;
    }

    const specialPrice =
        await prisma.customerProductPrice.findUnique({
            where: {
                customerId_productId: {
                    customerId,
                    productId,
                },
            },
        });

    return specialPrice?.price ?? product.basePrice;
}