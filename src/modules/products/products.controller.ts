import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';

import { FilesInterceptor } from '@nestjs/platform-express';

import { diskStorage } from 'multer';

import { extname, join } from 'path';
import { randomUUID } from 'crypto';

import { ProductsService } from './products.service';
import { ProductImagesService } from './product-images.service';

import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { UpdateProductImageDto } from './dto/update-product-image.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('products')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly productImagesService: ProductImagesService,
  ) { }

  @Get()
  findAll() {
    return this.productsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(Number(id));
  }

  @Post()
  create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return this.productsService.update(
      Number(id),
      updateProductDto,
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productsService.remove(Number(id));
  }

  // ------------------------------
  // PRODUCT IMAGES
  // ------------------------------

  @Post(':id/images')
  @UseInterceptors(
    FilesInterceptor('images', 20, {
      storage: diskStorage({
        destination: join(
          process.cwd(),
          'uploads',
          'products',
        ),

        filename: (
          request,
          file,
          callback,
        ) => {
          const extension = extname(
            file.originalname,
          ).toLowerCase();

          callback(
            null,
            `${randomUUID()}${extension}`,
          );
        },
      }),

      fileFilter: (
        request,
        file,
        callback,
      ) => {
        const allowedTypes = [
          'image/jpeg',
          'image/png',
          'image/webp',
        ];

        if (!allowedTypes.includes(file.mimetype)) {
          return callback(
            new BadRequestException(
              'Only JPG, PNG, and WEBP images are allowed.',
            ),
            false,
          );
        }

        callback(null, true);
      },

      limits: {
        fileSize: 5 * 1024 * 1024,
      },
    }),
  )
  uploadImages(
    @Param('id') id: string,
    @UploadedFiles()
    files: Express.Multer.File[],
    @Body('colorId')
    colorId?: string,
  ) {
    let parsedColorId: number | undefined;

    if (colorId) {
      parsedColorId = Number(colorId);

      if (Number.isNaN(parsedColorId)) {
        throw new BadRequestException(
          'Invalid color ID.',
        );
      }
    }

    return this.productImagesService.createMany(
      Number(id),
      files,
      parsedColorId,
    );
  }

  @Get(':id/images')
  getImages(
    @Param('id') id: string,
  ) {
    return this.productImagesService.getProductImages(
      Number(id),
    );
  }

  @Patch(':id/images/:imageId')
  updateImage(
    @Param('id') id: string,
    @Param('imageId') imageId: string,
    @Body()
    dto: UpdateProductImageDto,
  ) {
    return this.productImagesService.update(
      Number(id),
      Number(imageId),
      dto,
    );
  }

  @Delete(':id/images/:imageId')
  deleteImage(
    @Param('id') id: string,
    @Param('imageId') imageId: string,
  ) {
    return this.productImagesService.remove(
      Number(id),
      Number(imageId),
    );
  }
}