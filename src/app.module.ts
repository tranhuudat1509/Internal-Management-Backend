import { Module } from '@nestjs/common';

import { CustomersModule } from './modules/customers/customers.module';
import { CustomerContactsModule } from './modules/customer-contacts/customer-contacts.module';
import { ProductsModule } from './modules/products/products.module';
import { OrdersModule } from './modules/orders/orders.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { OrderItemsModule } from './modules/order-items/order-items.module';
import { CustomerProductPricesModule } from './modules/customer-product-prices/customer-product-prices.module';
import { ReportsModule } from './modules/reports/reports.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { SearchModule } from './modules/search/search.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { APP_GUARD } from '@nestjs/core';

import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';

@Module({
  imports: [
    CustomersModule,
    CustomerContactsModule,

    ProductsModule,
    OrdersModule,
    PaymentsModule,
    OrderItemsModule,
    CustomerProductPricesModule,
    ReportsModule,
    DashboardModule,
    SearchModule,

    UsersModule,
    AuthModule,
  ],

  providers: [

    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },

  ],
})
export class AppModule { }