import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { DimensionUnit } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';

import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(
    private prisma: PrismaService,
  ) { }

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
    const product =
      await this.prisma.product.findUnique({
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
      throw new NotFoundException(
        'Product not found.',
      );
    }

    return product;
  }

  async create(
    createProductDto: CreateProductDto,
  ) {
    const {
      colors,
      ...productData
    } = createProductDto;

    const normalizedColors = Array.from(
      new Set(
        (colors ?? [])
          .map((name) => name.trim())
          .filter((name) => name.length > 0),
      ),
    );

    return this.prisma.product.create({
      data: {
        ...productData,

        dimensionUnit:
          createProductDto.dimensionUnit ??
          DimensionUnit.CM,

        isActive:
          createProductDto.isActive ??
          true,

        colors:
          normalizedColors.length > 0
            ? {
              create:
                normalizedColors.map(
                  (name, index) => ({
                    name,
                    sortOrder: index,
                    isActive: true,
                    retiredAt: null,
                  }),
                ),
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

  async update(
    id: number,
    updateProductDto: UpdateProductDto,
  ) {
    const product =
      await this.prisma.product.findUnique({
        where: {
          id,
        },

        include: {
          colors: true,
        },
      });

    if (!product) {
      throw new NotFoundException(
        'Product not found.',
      );
    }

    const {
      colors,
      ...productData
    } = updateProductDto;

    if (colors !== undefined) {
      const normalizedColors = Array.from(
        new Set(
          colors
            .map((name) => name.trim())
            .filter(
              (name) =>
                name.length > 0,
            ),
        ),
      );

      const activeColorNames =
        new Set(normalizedColors);

      const retirementTime =
        new Date();

      /*
       * Retire colors that were previously active
       * but are no longer in the submitted list.
       *
       * We DO NOT delete them.
       */
      for (const existingColor of product.colors) {
        const shouldRemainActive =
          activeColorNames.has(
            existingColor.name,
          );

        if (
          existingColor.isActive &&
          !shouldRemainActive
        ) {
          await this.prisma.productColor.update({
            where: {
              id: existingColor.id,
            },

            data: {
              isActive: false,
              retiredAt:
                retirementTime,
            },
          });
        }
      }

      /*
       * Keep active colors,
       * reactivate old colors,
       * or create brand-new colors.
       */
      for (
        let index = 0;
        index < normalizedColors.length;
        index++
      ) {
        const name =
          normalizedColors[index];

        const existingColor =
          product.colors.find(
            (color) =>
              color.name === name,
          );

        if (existingColor) {
          await this.prisma.productColor.update({
            where: {
              id: existingColor.id,
            },

            data: {
              sortOrder: index,
              isActive: true,
              retiredAt: null,
            },
          });
        } else {
          await this.prisma.productColor.create({
            data: {
              productId: id,
              name,
              sortOrder: index,
              isActive: true,
              retiredAt: null,
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
    const product =
      await this.prisma.product.findUnique({
        where: {
          id,
        },
      });

    if (!product) {
      throw new NotFoundException(
        'Product not found.',
      );
    }

    return this.prisma.product.delete({
      where: {
        id,
      },
    });
  }
}