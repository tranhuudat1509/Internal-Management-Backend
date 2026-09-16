import {
    Injectable,
    NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';
import { CreateCustomerContactDto } from './dto/create-customer-contact.dto';
import { UpdateCustomerContactDto } from './dto/update-customer-contact.dto';

@Injectable()
export class CustomerContactsService {

    constructor(
        private prisma: PrismaService,
    ) { }

    async findAll() {

        return this.prisma.customerContact.findMany({

            include: {
                customer: true,
            },

            orderBy: {
                contactName: 'asc',
            },

        });

    }

    async findOne(id: number) {

        const contact =
            await this.prisma.customerContact.findUnique({

                where: {
                    id,
                },

                include: {
                    customer: true,
                },

            });

        if (!contact) {
            throw new NotFoundException(
                'Customer contact not found',
            );
        }

        return contact;

    }

    async create(dto: any) {

        return this.prisma.customerContact.create({

            data: dto,

            include: {
                customer: true,
            },

        });

    }

    async update(
        id: number,
        dto: any,
    ) {

        await this.findOne(id);

        return this.prisma.customerContact.update({

            where: {
                id,
            },

            data: dto,

            include: {
                customer: true,
            },

        });

    }

    async remove(id: number) {

        await this.findOne(id);

        return this.prisma.customerContact.delete({

            where: {
                id,
            },

        });

    }

}