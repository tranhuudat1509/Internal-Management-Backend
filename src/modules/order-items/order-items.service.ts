import {
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { ensureOrderEditable } from '../orders/helpers/ensure-order-editable';

import { PrismaService } from '../../database/prisma.service';

import { CreateOrderItemDto } from './dto/create-order-item.dto';
import { UpdateOrderItemDto } from './dto/update-order-item.dto';
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
        });

        if (!product) {
            throw new NotFoundException('Product not found.');
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

        const orderItem = await this.prisma.orderItem.create({
            data: {
                orderId: createOrderItemDto.orderId,
                productId: createOrderItemDto.productId,
                quantity: createOrderItemDto.quantity,
                unitPrice,
                lineTotal,
            },

            include: {
                order: true,
                product: true,
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

        const product = await this.prisma.product.findUnique({
            where: {
                id:
                    updateOrderItemDto.productId ??
                    existingOrderItem.productId,
            },
        });

        if (!product) {
            throw new NotFoundException('Product not found.');
        }

        const quantity =
            updateOrderItemDto.quantity ??
            existingOrderItem.quantity;

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
                quantity,
                unitPrice,
            );

        const orderItem =
            await this.prisma.orderItem.update({
                where: {
                    id,
                },

                data: {
                    productId: updateOrderItemDto.productId,
                    quantity,
                    unitPrice,
                    lineTotal,
                },

                include: {
                    order: true,
                    product: true,
                },
            });

        await recalculateOrderTotals(
            this.prisma,
            orderItem.orderId,
        );

        return orderItem;
    }

    async remove(id: number) {
        const orderItem = await this.prisma.orderItem.findUnique({
            where: { id },
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
            where: { id },
        });

        await recalculateOrderTotals(
            this.prisma,
            orderItem.orderId,
        );

        return {
            message: 'Order item deleted successfully.',
        };
    }
}