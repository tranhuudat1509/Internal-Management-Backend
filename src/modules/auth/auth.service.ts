import {
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';

import { UsersService } from '../users/users.service';

import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {

    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
    ) { }

    async login(dto: LoginDto) {

        const user = await this.usersService.findByUsername(
            dto.username,
        );

        if (!user) {

            throw new UnauthorizedException(
                'Invalid username or password.',
            );

        }

        const passwordMatches = await bcrypt.compare(
            dto.password,
            user.passwordHash,
        );

        if (!passwordMatches) {

            throw new UnauthorizedException(
                'Invalid username or password.',
            );

        }

        const payload = {

            sub: user.id,

            username: user.username,

        };

        return {

            access_token: await this.jwtService.signAsync(payload),

            user: {

                id: user.id,
                name: user.name,
                username: user.username,

            },

        };
    }

}