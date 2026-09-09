import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';

import { OrderItemsController } from './order-items.controller';
import { OrderItemsService } from './order-items.service';

@Module({
    imports: [PrismaModule],
    controllers: [OrderItemsController],
    providers: [OrderItemsService],
})
export class OrderItemsModule { }