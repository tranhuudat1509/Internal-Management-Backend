import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';

import { CreateOrderItemDto } from './dto/create-order-item.dto';
import { UpdateOrderItemDto } from './dto/update-order-item.dto';

import { ensureOrderEditable } from '../orders/helpers/ensure-order-editable';
import { recalculateOrderTotals } from '../orders/helpers/recalculate-order';
import { getEffectiveProductPrice } from '../orders/helpers/get-effective-product-price';
import { calculateOrderItemTotal } from '../orders/helpers/calculate-order-item-total';

@Injectable()
export class OrderItemsService {

    constructor(private prisma: PrismaService) { }

    async findAll() {
        return this.prisma.orderItem.findMany({
            include: {
                order: {
                    include: {
                        customer: true,
                    },
                },

                product: true,
                color: true,
            },
        });
    }

    async findOne(id: number) {
        const orderItem = await this.prisma.orderItem.findUnique({
            where: {
                id,
            },

            include: {
                order: {
                    include: {
                        customer: true,
                    },
                },

                product: true,
                color: true,
            },
        });

        if (!orderItem) {
            throw new NotFoundException(
                'Order item not found.',
            );
        }

        return orderItem;
    }

    async create(createOrderItemDto: CreateOrderItemDto) {

        const order = await ensureOrderEditable(
            this.prisma,
            createOrderItemDto.orderId,
        );

        const product = await this.prisma.product.findUnique({
            where: {
                id: createOrderItemDto.productId,
            },

            include: {
                colors: {
                    where: {
                        isActive: true,
                    },

                    orderBy: {
                        sortOrder: 'asc',
                    },
                },
            },
        });

        if (!product) {
            throw new NotFoundException(
                'Product not found.',
            );
        }

        let selectedColor:
            | (typeof product.colors)[number]
            | null = null;

        if (product.colors.length > 0) {

            if (createOrderItemDto.colorId === undefined) {
                throw new BadRequestException(
                    'A color must be selected for this product.',
                );
            }

            selectedColor =
                product.colors.find(
                    (color) =>
                        color.id === createOrderItemDto.colorId,
                ) ?? null;

            if (!selectedColor) {
                throw new BadRequestException(
                    'Selected color is not active or does not belong to this product.',
                );
            }

        } else if (createOrderItemDto.colorId !== undefined) {

            throw new BadRequestException(
                'This product does not have an active color selection.',
            );
        }

        const unitPrice =
            await getEffectiveProductPrice(
                this.prisma,
                order.customerId,
                product.id,
            );

        if (unitPrice === null) {
            throw new NotFoundException(
                'Product not found.',
            );
        }

        const lineTotal =
            calculateOrderItemTotal(
                createOrderItemDto.quantity,
                unitPrice,
            );

        const orderItem =
            await this.prisma.orderItem.create({
                data: {
                    orderId: createOrderItemDto.orderId,

                    productId: createOrderItemDto.productId,

                    colorId:
                        selectedColor?.id ?? null,

                    colorNameSnapshot:
                        selectedColor?.name ?? null,

                    quantity: createOrderItemDto.quantity,

                    unitPrice,

                    lineTotal,
                },

                include: {
                    order: true,
                    product: true,
                    color: true,
                },
            });

        await recalculateOrderTotals(
            this.prisma,
            orderItem.orderId,
        );

        return orderItem;
    }

    async update(
        id: number,
        updateOrderItemDto: UpdateOrderItemDto,
    ) {

        const existingOrderItem =
            await this.prisma.orderItem.findUnique({
                where: {
                    id,
                },
            });

        if (!existingOrderItem) {
            throw new NotFoundException(
                'Order item not found.',
            );
        }

        const order = await ensureOrderEditable(
            this.prisma,
            existingOrderItem.orderId,
        );

        const targetProductId =
            updateOrderItemDto.productId ??
            existingOrderItem.productId;

        const productChanged =
            targetProductId !==
            existingOrderItem.productId;

        const product =
            await this.prisma.product.findUnique({
                where: {
                    id: targetProductId,
                },

                include: {
                    colors: {
                        where: {
                            isActive: true,
                        },

                        orderBy: {
                            sortOrder: 'asc',
                        },
                    },
                },
            });

        if (!product) {
            throw new NotFoundException(
                'Product not found.',
            );
        }

        const quantity =
            updateOrderItemDto.quantity ??
            existingOrderItem.quantity;

        let colorId =
            existingOrderItem.colorId;

        let colorNameSnapshot =
            existingOrderItem.colorNameSnapshot;

        /*
         * Product changed:
         * the selected color must be valid for the new product.
         */
        if (productChanged) {

            if (product.colors.length > 0) {

                if (updateOrderItemDto.colorId === undefined) {
                    throw new BadRequestException(
                        'A color must be selected for this product.',
                    );
                }

                const selectedColor =
                    product.colors.find(
                        (color) =>
                            color.id ===
                            updateOrderItemDto.colorId,
                    );

                if (!selectedColor) {
                    throw new BadRequestException(
                        'Selected color is not active or does not belong to this product.',
                    );
                }

                colorId = selectedColor.id;
                colorNameSnapshot = selectedColor.name;

            } else {

                if (updateOrderItemDto.colorId !== undefined) {
                    throw new BadRequestException(
                        'This product does not have an active color selection.',
                    );
                }

                colorId = null;
                colorNameSnapshot = null;
            }

            /*
             * Same product, but user explicitly changed the color.
             */
        } else if (updateOrderItemDto.colorId !== undefined) {

            const selectedColor =
                product.colors.find(
                    (color) =>
                        color.id ===
                        updateOrderItemDto.colorId,
                );

            if (!selectedColor) {
                throw new BadRequestException(
                    'Selected color is not active or does not belong to this product.',
                );
            }

            colorId = selectedColor.id;
            colorNameSnapshot = selectedColor.name;
        }

        /*
         * Preserve the historical unit price unless
         * the product itself was changed.
         */
        let unitPrice =
            existingOrderItem.unitPrice;

        if (productChanged) {

            const effectivePrice =
                await getEffectiveProductPrice(
                    this.prisma,
                    order.customerId,
                    product.id,
                );

            if (effectivePrice === null) {
                throw new NotFoundException(
                    'Product not found.',
                );
            }

            unitPrice = effectivePrice;
        }

        const lineTotal =
            calculateOrderItemTotal(
                quantity,
                unitPrice,
            );

        const orderItem =
            await this.prisma.orderItem.update({
                where: {
                    id,
                },

                data: {
                    productId: targetProductId,

                    colorId,

                    colorNameSnapshot,

                    quantity,

                    unitPrice,

                    lineTotal,
                },

                include: {
                    order: true,
                    product: true,
                    color: true,
                },
            });

        await recalculateOrderTotals(
            this.prisma,
            orderItem.orderId,
        );

        return orderItem;
    }

    async remove(id: number) {

        const orderItem =
            await this.prisma.orderItem.findUnique({
                where: {
                    id,
                },
            });

        if (!orderItem) {
            throw new NotFoundException(
                'Order item not found.',
            );
        }

        await ensureOrderEditable(
            this.prisma,
            orderItem.orderId,
        );

        await this.prisma.orderItem.delete({
            where: {
                id,
            },
        });

        await recalculateOrderTotals(
            this.prisma,
            orderItem.orderId,
        );

        return {
            message:
                'Order item deleted successfully.',
        };
    }
}