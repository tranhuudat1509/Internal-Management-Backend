import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
} from '@nestjs/common';

import { OrderItemsService } from './order-items.service';
import { CreateOrderItemDto } from './dto/create-order-item.dto';
import { UpdateOrderItemDto } from './dto/update-order-item.dto';

@Controller('order-items')
export class OrderItemsController {
    constructor(private readonly orderItemsService: OrderItemsService,) { }

    @Get()
    findAll() {
        return this.orderItemsService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.orderItemsService.findOne(+id);
    }

    @Post()
    create(@Body() createOrderItemDto: CreateOrderItemDto) {
        return this.orderItemsService.create(createOrderItemDto);
    }

    @Patch(':id')
    update(
        @Param('id') id: string,
        @Body() updateOrderItemDto: UpdateOrderItemDto,
    ) {
        return this.orderItemsService.update(+id, updateOrderItemDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.orderItemsService.remove(+id);
    }
}