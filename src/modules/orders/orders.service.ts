import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';

import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { calculateOrderFinancialSummary } from './helpers/order-financial-summary';
import { recalculateOrderTotals } from './helpers/recalculate-order';
import { OrderStatus } from '@prisma/client';
import { ensureOrderEditable } from './helpers/ensure-order-editable';
import { getEffectiveProductPrice } from './helpers/get-effective-product-price';
import { calculateOrderItemTotal } from './helpers/calculate-order-item-total';
import { getOrderWithDetails }
  from './helpers/get-order-with-details';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) { }

  async findAll() {
    const orders = await this.prisma.order.findMany({
      include: {
        customer: true,
        items: {
          include: {
            product: true,
          }
        },
        payments: true,
      },
    });

    return orders.map((order) => ({
      ...order,
      financialSummary: calculateOrderFinancialSummary(
        order.total,
        order.payments,
      ),
    }));
  }

  async findOne(id: number) {
    const order =
      await getOrderWithDetails(
        this.prisma,
        id,
      );

    const financialSummary = calculateOrderFinancialSummary(
      order.total,
      order.payments,
    );

    return {
      ...order,
      financialSummary,
    };
  }

  async create(createOrderDto: CreateOrderDto) {

    const customer = await this.prisma.customer.findUnique({
      where: {
        id: createOrderDto.customerId,
      },
    });

    if (!customer) {
      throw new NotFoundException(
        'Customer not found.',
      );
    }

    const orderItems: {
      productId: number;
      quantity: number;
      unitPrice: number;
      lineTotal: number;
    }[] = [];

    for (const item of createOrderDto.items) {
      const product =
        await this.prisma.product.findUnique({
          where: {
            id: item.productId,
          },
        });

      if (!product) {
        throw new NotFoundException(
          `Product ${item.productId} not found.`,
        );
      }

      const unitPrice = await getEffectiveProductPrice(
        this.prisma,
        customer.id,
        product.id,
      );

      if (unitPrice === null) {
        throw new NotFoundException(
          `Product ${item.productId} not found.`,
        );
      }

      const lineTotal = calculateOrderItemTotal(
        item.quantity,
        unitPrice,
      );

      orderItems.push({
        productId: product.id,
        quantity: item.quantity,
        unitPrice,
        lineTotal,
      });
    }

    const order = await this.prisma.order.create({
      data: {
        customerId: createOrderDto.customerId,

        orderDate: createOrderDto.orderDate
          ? new Date(createOrderDto.orderDate)
          : undefined,

        status:
          createOrderDto.status ??
          OrderStatus.IN_PROGRESS,

        deliveryDate:
          createOrderDto.status === OrderStatus.DELIVERED
            ? new Date()
            : null,

        notes: createOrderDto.notes,

        discount: createOrderDto.discount ?? 0,

        items: {
          create: orderItems,
        },
      },
    });

    await recalculateOrderTotals(
      this.prisma,
      order.id,
    );

    return this.findOne(order.id);
  }

  async getDetails(id: number) {
    const order =
      await getOrderWithDetails(
        this.prisma,
        id,
      );

    const financialSummary =
      calculateOrderFinancialSummary(
        order.total,
        order.payments,
      );

    const itemsSummary =
      order.items.map((item) => ({

        productId: item.product.id,

        code: item.product.code,

        name: item.product.name,

        unit: item.product.unit,

        quantity: item.quantity,

        unitPrice: item.unitPrice,

        lineTotal: item.lineTotal,

      }));

    const paymentsSummary =
      order.payments.map((payment) => ({

        id: payment.id,

        paymentDate: payment.paymentDate,

        amount: payment.amount,

        paymentMethod: payment.paymentMethod,

        notes: payment.notes,

      }));

    return {

      order: {

        id: order.id,

        status: order.status,

        orderDate: order.orderDate,

        deliveryDate: order.deliveryDate,

        subtotal: order.subtotal,

        discount: order.discount,

        total: order.total,

        notes: order.notes,

      },

      customer: order.customer,

      financialSummary,

      items: itemsSummary,

      payments: paymentsSummary,

    };
  }

  async update(id: number, updateOrderDto: UpdateOrderDto) {

    const existingOrder = await ensureOrderEditable(
      this.prisma,
      id,
    );

    let status = existingOrder.status;
    let deliveryDate = existingOrder.deliveryDate;

    if (updateOrderDto.status !== undefined) {

      status = updateOrderDto.status;

      if (
        status === OrderStatus.DELIVERED &&
        existingOrder.status !== OrderStatus.DELIVERED
      ) {
        deliveryDate = new Date();
      }

      if (status !== OrderStatus.DELIVERED) {
        deliveryDate = null;
      }
    }

    await this.prisma.order.update({
      where: {
        id,
      },

      data: {
        orderDate: updateOrderDto.orderDate
          ? new Date(updateOrderDto.orderDate)
          : undefined,

        status,
        deliveryDate,

        notes: updateOrderDto.notes,
        discount: updateOrderDto.discount,
      },
    });

    await recalculateOrderTotals(
      this.prisma,
      id,
    );

    return this.findOne(id);
  }

  async remove(id: number) {
    const order = await this.prisma.order.findUnique({
      where: {
        id,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found.');
    }

    return this.prisma.order.delete({
      where: {
        id,
      },
    });
  }
}
