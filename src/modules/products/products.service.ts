import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { DimensionUnit } from '@prisma/client';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) { }

  async findAll() {
    return this.prisma.product.findMany();
  }

  async findOne(id: number) {
    const product = await this.prisma.product.findUnique({
      where: {
        id,
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found.');
    }

    return product;
  }

  async create(createProductDto: CreateProductDto) {
    return this.prisma.product.create({
      data: {
        code: createProductDto.code,
        name: createProductDto.name,
        category: createProductDto.category,
        material: createProductDto.material,
        color: createProductDto.color,
        length: createProductDto.length,
        width: createProductDto.width,
        height: createProductDto.height,
        dimensionUnit:
          createProductDto.dimensionUnit ?? DimensionUnit.CM,
        weight: createProductDto.weight,
        basePrice: createProductDto.basePrice,
        unit: createProductDto.unit,
        description: createProductDto.description,
        isActive: createProductDto.isActive ?? true,
      },
    });
  }

  async update(id: number, updateProductDto: UpdateProductDto) {
    const product = await this.prisma.product.findUnique({
      where: {
        id,
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found.');
    }

    return this.prisma.product.update({
      where: {
        id,
      },

      data: {
        code: updateProductDto.code,
        name: updateProductDto.name,
        category: updateProductDto.category,
        material: updateProductDto.material,
        color: updateProductDto.color,
        length: updateProductDto.length,
        width: updateProductDto.width,
        height: updateProductDto.height,
        dimensionUnit: updateProductDto.dimensionUnit,
        weight: updateProductDto.weight,
        basePrice: updateProductDto.basePrice,
        unit: updateProductDto.unit,
        description: updateProductDto.description,
        isActive: updateProductDto.isActive,
      },
    });
  }

  async remove(id: number) {
    const product = await this.prisma.product.findUnique({
      where: {
        id,
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found.');
    }

    return this.prisma.product.delete({
      where: {
        id,
      },
    });
  }
}
