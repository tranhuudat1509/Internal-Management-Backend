import { Module } from '@nestjs/common';

import { CustomerContactsController }
    from './customer-contacts.controller';

import { CustomerContactsService }
    from './customer-contacts.service';

import { PrismaService }
    from '../../database/prisma.service';

@Module({

    controllers: [
        CustomerContactsController,
    ],

    providers: [
        CustomerContactsService,
        PrismaService,
    ],

})
export class CustomerContactsModule { }