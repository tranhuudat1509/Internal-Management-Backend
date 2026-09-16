import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseIntPipe,
    Patch,
    Post,
} from '@nestjs/common';

import { CustomerContactsService } from './customer-contacts.service';
import { CreateCustomerContactDto } from './dto/create-customer-contact.dto';
import { UpdateCustomerContactDto } from './dto/update-customer-contact.dto';
import { UseGuards } from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('customer-contacts')
export class CustomerContactsController {

    constructor(
        private readonly customerContactsService: CustomerContactsService,
    ) { }

    @Get()
    findAll() {
        return this.customerContactsService.findAll();
    }

    @Get(':id')
    findOne(
        @Param('id', ParseIntPipe) id: number,
    ) {
        return this.customerContactsService.findOne(id);
    }

    @Post()
    create(
        @Body() dto: CreateCustomerContactDto,
    ) {
        return this.customerContactsService.create(dto);
    }

    @Patch(':id')
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateCustomerContactDto,
    ) {
        return this.customerContactsService.update(id, dto);
    }

    @Delete(':id')
    remove(
        @Param('id', ParseIntPipe) id: number,
    ) {
        return this.customerContactsService.remove(id);
    }
}