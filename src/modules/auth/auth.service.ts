import {
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';

import { UsersService } from '../users/users.service';

import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {

    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
    ) { }

    async login(dto: LoginDto) {

        const users = await this.usersService.findAll();

        const user = users.find(
            (u) => u.username === dto.username,
        );

        if (!user) {

            throw new UnauthorizedException(
                'Invalid username or password.',
            );

        }

        if (user.passwordHash !== dto.password) {

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

        };
    }

}