import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { CustomerProductPricesService } from './customer-product-prices.service';
import { CreateCustomerProductPriceDto } from './dto/create-customer-product-price.dto';
import { UpdateCustomerProductPriceDto } from './dto/update-customer-product-price.dto';
import { UseGuards } from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('customer-product-prices')
export class CustomerProductPricesController {
  constructor(private readonly customerProductPricesService: CustomerProductPricesService) { }

  @Post()
  create(@Body() createCustomerProductPriceDto: CreateCustomerProductPriceDto) {
    return this.customerProductPricesService.create(createCustomerProductPriceDto);
  }

  @Get()
  findAll() {
    return this.customerProductPricesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.customerProductPricesService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCustomerProductPriceDto: UpdateCustomerProductPriceDto) {
    return this.customerProductPricesService.update(+id, updateCustomerProductPriceDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.customerProductPricesService.remove(+id);
  }
}
