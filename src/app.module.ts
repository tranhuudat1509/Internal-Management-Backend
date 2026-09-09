import { Module } from '@nestjs/common';

import { CustomersModule } from './modules/customers/customers.module';
import { ProductsModule } from './modules/products/products.module';
import { OrdersModule } from './modules/orders/orders.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { OrderItemsModule } from './modules/order-items/order-items.module';

@Module({
  imports: [
    CustomersModule,
    ProductsModule,
    OrdersModule,
    PaymentsModule,
    OrderItemsModule,
  ],
})
export class AppModule { }