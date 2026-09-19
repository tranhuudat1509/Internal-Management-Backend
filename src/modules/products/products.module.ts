import { Module } from '@nestjs/common';

import { PrismaModule } from '../../database/prisma.module';

import { ProductsService } from './products.service';
import { ProductImagesService } from './product-images.service';

import { ProductsController } from './products.controller';

@Module({
  imports: [PrismaModule],

  providers: [
    ProductsService,
    ProductImagesService,
  ],

  controllers: [ProductsController],
})
export class ProductsModule { }