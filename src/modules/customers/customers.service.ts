import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) { }

  async findAll() {
    return this.prisma.customer.findMany({
      include: {
        contacts: true,
      },
    });
  }

  async findOne(id: number) {
    const customer = await this.prisma.customer.findUnique({
      where: {
        id,
      },

      include: {
        contacts: true,
      },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found.');
    }

    return customer;
  }

  async update(id: number, updateCustomerDto: UpdateCustomerDto) {
    const customer = await this.prisma.customer.findUnique({
      where: {
        id,
      },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found.');
    }

    return this.prisma.customer.update({
      where: {
        id,
      },

      data: {
        companyName: updateCustomerDto.companyName,
        city: updateCustomerDto.city,
        address: updateCustomerDto.address,
        notes: updateCustomerDto.notes,
        isActive: updateCustomerDto.isActive,
      },

      include: {
        contacts: true,
      },
    });
  }

  async remove(id: number) {
    const customer = await this.prisma.customer.findUnique({
      where: {
        id,
      },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found.');
    }

    return this.prisma.customer.delete({
      where: {
        id,
      },
    });
  }

  async create(createCustomerDto: CreateCustomerDto) {
    return this.prisma.customer.create({
      data: {
        companyName: createCustomerDto.companyName,
        city: createCustomerDto.city,
        address: createCustomerDto.address,
        notes: createCustomerDto.notes,
        isActive: createCustomerDto.isActive ?? true,

        contacts: {
          create: createCustomerDto.contacts,
        },
      },

      include: {
        contacts: true,
      },
    });
  }
}
