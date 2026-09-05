import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.customer.findMany({
      include: {
        contacts: true,
      },
    });
  }

  async findOne(id: number) {
    return this.prisma.customer.findUnique({
      where: {
        id,
      },
      include: {
        contacts: true,
      },
    });
  }

  async update(id: number, updateCustomerDto: UpdateCustomerDto) {
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
    console.log('Deleting customer with id:', id);

    const customer = await this.prisma.customer.findUnique({
      where: { id },
    });

    console.log('Customer found:', customer);

    return this.prisma.customer.delete({
      where: { id },
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
