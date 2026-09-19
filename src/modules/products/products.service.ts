import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { DimensionUnit } from '@prisma/client';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) { }

  async findAll() {
    return this.prisma.product.findMany({
      include: {
        colors: {
          orderBy: {
            sortOrder: 'asc',
          },
        },
        images: {
          orderBy: {
            sortOrder: 'asc',
          },
        },
      },
    });
  }

  async findOne(id: number) {
    const product = await this.prisma.product.findUnique({
      where: {
        id,
      },
      include: {
        colors: {
          orderBy: {
            sortOrder: 'asc',
          },
        },
        images: {
          orderBy: {
            sortOrder: 'asc',
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found.');
    }

    return product;
  }

  async create(createProductDto: CreateProductDto) {
    const { colors, ...productData } = createProductDto;

    return this.prisma.product.create({
      data: {
        ...productData,

        dimensionUnit:
          createProductDto.dimensionUnit ?? DimensionUnit.CM,

        isActive: createProductDto.isActive ?? true,

        colors: colors?.length
          ? {
            create: colors.map((name, index) => ({
              name: name.trim(),
              sortOrder: index,
            })),
          }
          : undefined,
      },

      include: {
        colors: {
          orderBy: {
            sortOrder: 'asc',
          },
        },
        images: {
          orderBy: {
            sortOrder: 'asc',
          },
        },
      },
    });
  }

  async update(id: number, updateProductDto: UpdateProductDto) {
    const product = await this.prisma.product.findUnique({
      where: {
        id,
      },
      include: {
        colors: true,
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found.');
    }

    const { colors, ...productData } = updateProductDto;

    if (colors !== undefined) {
      const normalizedColors = colors.map((name) => name.trim());

      const existingNames = product.colors.map(
        (color) => color.name,
      );

      const colorsToAdd = normalizedColors.filter(
        (name) => !existingNames.includes(name),
      );

      const colorsToRemove = product.colors.filter(
        (color) => !normalizedColors.includes(color.name),
      );

      if (colorsToRemove.length > 0) {
        await this.prisma.productColor.deleteMany({
          where: {
            id: {
              in: colorsToRemove.map((color) => color.id),
            },
          },
        });
      }

      for (let index = 0; index < normalizedColors.length; index++) {
        const name = normalizedColors[index];

        const existingColor = product.colors.find(
          (color) => color.name === name,
        );

        if (existingColor) {
          await this.prisma.productColor.update({
            where: {
              id: existingColor.id,
            },
            data: {
              sortOrder: index,
            },
          });
        } else if (colorsToAdd.includes(name)) {
          await this.prisma.productColor.create({
            data: {
              productId: id,
              name,
              sortOrder: index,
            },
          });
        }
      }
    }

    return this.prisma.product.update({
      where: {
        id,
      },

      data: productData,

      include: {
        colors: {
          orderBy: {
            sortOrder: 'asc',
          },
        },
        images: {
          orderBy: {
            sortOrder: 'asc',
          },
        },
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
