import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class SearchService {

    constructor(
        private prisma: PrismaService,
    ) { }

    async search(q: string) {

        const [

            customers,

            products,

            contacts,

        ] = await Promise.all([

            this.prisma.customer.findMany({

                where: {
                    OR: [

                        {
                            companyName: {
                                contains: q,
                                mode: 'insensitive',
                            },
                        },

                        {
                            city: {
                                contains: q,
                                mode: 'insensitive',
                            },
                        },

                    ],
                },

                take: 10,

            }),

            this.prisma.product.findMany({

                where: {
                    OR: [

                        {
                            code: {
                                contains: q,
                                mode: 'insensitive',
                            },
                        },

                        {
                            name: {
                                contains: q,
                                mode: 'insensitive',
                            },
                        },

                        {
                            category: {
                                contains: q,
                                mode: 'insensitive',
                            },
                        },

                    ],
                },

                take: 10,

            }),

            this.prisma.customerContact.findMany({

                where: {
                    OR: [

                        {
                            contactName: {
                                contains: q,
                                mode: 'insensitive',
                            },
                        },

                        {
                            phone: {
                                contains: q,
                            },
                        },

                        {
                            email: {
                                contains: q,
                                mode: 'insensitive',
                            },
                        },

                    ],
                },

                include: {
                    customer: true,
                },

                take: 10,

            }),

        ]);

        return {

            customers,

            products,

            contacts,

        };
    }

}