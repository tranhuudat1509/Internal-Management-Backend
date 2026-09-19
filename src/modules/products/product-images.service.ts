import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';

import { UpdateProductImageDto } from './dto/update-product-image.dto';
import { unlink } from 'fs/promises';
import { join } from 'path';

@Injectable()
export class ProductImagesService {
    constructor(private prisma: PrismaService) { }

    async createMany(
        productId: number,
        files: Express.Multer.File[],
        colorId?: number,
    ) {
        const product = await this.prisma.product.findUnique({
            where: {
                id: productId,
            },
            include: {
                images: true,
            },
        });

        if (!product) {
            throw new NotFoundException('Product not found.');
        }

        if (!files || files.length === 0) {
            throw new BadRequestException(
                'At least one image is required.',
            );
        }

        if (colorId !== undefined) {
            const color =
                await this.prisma.productColor.findFirst({
                    where: {
                        id: colorId,
                        productId,
                    },
                });

            if (!color) {
                throw new BadRequestException(
                    'The selected color does not belong to this product.',
                );
            }
        }

        const startingOrder = product.images.length;

        const shouldCreatePrimary =
            product.images.length === 0;

        await this.prisma.productImage.createMany({
            data: files.map((file, index) => ({
                productId,

                colorId: colorId ?? null,

                fileName: file.filename,

                originalName: file.originalname,

                sortOrder: startingOrder + index,

                isPrimary:
                    shouldCreatePrimary && index === 0,
            })),
        });

        return this.getProductImages(productId);
    }

    async getProductImages(productId: number) {
        return this.prisma.productImage.findMany({
            where: {
                productId,
            },

            include: {
                color: true,
            },

            orderBy: {
                sortOrder: 'asc',
            },
        });
    }

    async update(
        productId: number,
        imageId: number,
        dto: UpdateProductImageDto,
    ) {
        const image =
            await this.prisma.productImage.findFirst({
                where: {
                    id: imageId,
                    productId,
                },
            });

        if (!image) {
            throw new NotFoundException(
                'Product image not found.',
            );
        }

        if (
            dto.colorId !== undefined &&
            dto.colorId !== null
        ) {
            const color =
                await this.prisma.productColor.findFirst({
                    where: {
                        id: dto.colorId,
                        productId,
                    },
                });

            if (!color) {
                throw new BadRequestException(
                    'The selected color does not belong to this product.',
                );
            }
        }

        if (dto.isPrimary === true) {
            await this.prisma.productImage.updateMany({
                where: {
                    productId,
                },
                data: {
                    isPrimary: false,
                },
            });
        }

        return this.prisma.productImage.update({
            where: {
                id: imageId,
            },

            data: {
                colorId: dto.colorId,
                sortOrder: dto.sortOrder,
                isPrimary: dto.isPrimary,
            },

            include: {
                color: true,
            },
        });
    }

    async remove(
        productId: number,
        imageId: number,
    ) {
        const image =
            await this.prisma.productImage.findFirst({
                where: {
                    id: imageId,
                    productId,
                },
            });

        if (!image) {
            throw new NotFoundException(
                'Product image not found.',
            );
        }

        await this.prisma.productImage.delete({
            where: {
                id: imageId,
            },
        });

        try {
            await unlink(
                join(
                    process.cwd(),
                    'uploads',
                    'products',
                    image.fileName,
                ),
            );
        } catch (error) {
            console.warn(
                `Could not delete product image file: ${image.fileName}`,
            );
        }

        // If the deleted image was the cover,
        // automatically promote the next image.
        if (image.isPrimary) {
            const nextImage =
                await this.prisma.productImage.findFirst({
                    where: {
                        productId,
                    },

                    orderBy: {
                        sortOrder: 'asc',
                    },
                });

            if (nextImage) {
                await this.prisma.productImage.update({
                    where: {
                        id: nextImage.id,
                    },

                    data: {
                        isPrimary: true,
                    },
                });
            }
        }

        return image;
    }
}