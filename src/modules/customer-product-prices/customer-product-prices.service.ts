import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateCustomerProductPriceDto } from './dto/create-customer-product-price.dto';
import { UpdateCustomerProductPriceDto } from './dto/update-customer-product-price.dto';

@Injectable()
export class CustomerProductPricesService {

  constructor(private prisma: PrismaService) { }

  async findAll() {
    return this.prisma.customerProductPrice.findMany({
      include: {
        customer: true,
        product: true,
      },
    });
  }

  async findOne(id: number) {
    const customerProductPrice =
      await this.prisma.customerProductPrice.findUnique({
        where: { id },
        include: {
          customer: true,
          product: true,
        },
      });

    if (!customerProductPrice) {
      throw new NotFoundException(
        'Customer product price not found.',
      );
    }

    return customerProductPrice;
  }

  async create(createCustomerProductPriceDto: CreateCustomerProductPriceDto) {
    const customer = await this.prisma.customer.findUnique({
      where: {
        id: createCustomerProductPriceDto.customerId,
      },
    });

    if (!customer) {
      throw new NotFoundException(
        'Customer not found.',
      );
    }

    const product = await this.prisma.product.findUnique({
      where: {
        id: createCustomerProductPriceDto.productId,
      },
    });

    if (!product) {
      throw new NotFoundException(
        'Product not found.',
      );
    }

    const existingPrice =
      await this.prisma.customerProductPrice.findUnique({
        where: {
          customerId_productId: {
            customerId:
              createCustomerProductPriceDto.customerId,
            productId:
              createCustomerProductPriceDto.productId,
          },
        },
      });

    if (existingPrice) {
      throw new BadRequestException(
        'A special price already exists for this customer and product.',
      );
    }

    return this.prisma.customerProductPrice.create({
      data: {
        customerId: createCustomerProductPriceDto.customerId,
        productId: createCustomerProductPriceDto.productId,
        price: createCustomerProductPriceDto.price,
        notes: createCustomerProductPriceDto.notes,
      },

      include: {
        customer: true,
        product: true,
      },
    });
  }

  async update(id: number, updateCustomerProductPriceDto: UpdateCustomerProductPriceDto) {
    const existingPrice =
      await this.prisma.customerProductPrice.findUnique({
        where: {
          id,
        },
      });

    if (!existingPrice) {
      throw new NotFoundException(
        'Customer product price not found.',
      );
    }

    const customerId =
      updateCustomerProductPriceDto.customerId ??
      existingPrice.customerId;

    const productId =
      updateCustomerProductPriceDto.productId ??
      existingPrice.productId;

    const customer =
      await this.prisma.customer.findUnique({
        where: {
          id: customerId,
        },
      });

    if (!customer) {
      throw new NotFoundException(
        'Customer not found.',
      );
    }

    const product =
      await this.prisma.product.findUnique({
        where: {
          id: productId,
        },
      });

    if (!product) {
      throw new NotFoundException(
        'Product not found.',
      );
    }

    const duplicatePrice =
      await this.prisma.customerProductPrice.findUnique({
        where: {
          customerId_productId: {
            customerId,
            productId,
          },
        },
      });

    if (
      duplicatePrice &&
      duplicatePrice.id !== id
    ) {
      throw new BadRequestException(
        'A special price already exists for this customer and product.',
      );
    }

    await this.prisma.customerProductPrice.update({
      where: {
        id,
      },

      data: {
        customerId,
        productId,

        price: updateCustomerProductPriceDto.price,

        notes: updateCustomerProductPriceDto.notes,
      },
    });

    return this.findOne(id);
  }

  async remove(id: number) {
    const customerProductPrice =
      await this.prisma.customerProductPrice.findUnique({
        where: {
          id,
        },
      });

    if (!customerProductPrice) {
      throw new NotFoundException(
        'Customer product price not found.',
      );
    }

    await this.prisma.customerProductPrice.delete({
      where: {
        id,
      },
    });

    return {
      message:
        'Customer product price deleted successfully.',
    };
  }
}
