import { Module } from '@nestjs/common';
import { CustomerProductPricesService } from './customer-product-prices.service';
import { CustomerProductPricesController } from './customer-product-prices.controller';

@Module({
  controllers: [CustomerProductPricesController],
  providers: [CustomerProductPricesService],
})
export class CustomerProductPricesModule {}
