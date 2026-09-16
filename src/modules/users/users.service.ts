import {
    ConflictException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';

import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {

    constructor(
        private prisma: PrismaService,
    ) { }

    async findAll() {

        return this.prisma.user.findMany({

            orderBy: {
                username: 'asc',
            },

        });

    }

    async findOne(id: number) {

        const user = await this.prisma.user.findUnique({

            where: {
                id,
            },

        });

        if (!user) {

            throw new NotFoundException(
                `User with ID ${id} not found.`,
            );

        }

        return user;

    }

    async create(dto: CreateUserDto) {

        const existingUser = await this.prisma.user.findUnique({

            where: {
                username: dto.username,
            },

        });

        if (existingUser) {

            throw new ConflictException(
                'Username already exists.',
            );

        }

        return this.prisma.user.create({

            data: {
                name: dto.name,
                username: dto.username,
                passwordHash: dto.password,
                isActive: dto.isActive,
            },

        });

    }

    async update(
        id: number,
        dto: UpdateUserDto,
    ) {

        await this.findOne(id);

        if (dto.username) {

            const existingUser = await this.prisma.user.findUnique({

                where: {
                    username: dto.username,
                },

            });

            if (existingUser && existingUser.id !== id) {

                throw new ConflictException(
                    'Username already exists.',
                );

            }

        }

        const data: any = {};

        if (dto.name !== undefined)
            data.name = dto.name;

        if (dto.username !== undefined)
            data.username = dto.username;

        if (dto.password !== undefined)
            data.passwordHash = dto.password;

        if (dto.isActive !== undefined)
            data.isActive = dto.isActive;

        return this.prisma.user.update({

            where: {
                id,
            },

            data,

        });

    }

    async remove(id: number) {

        await this.findOne(id);

        return this.prisma.user.delete({

            where: {
                id,
            },

        });

    }

}