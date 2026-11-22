import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './register.dto.js';
import { User } from './user.model.js';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
    async registerUser(payload: CreateUserDto): Promise<User> {
        const hash = await this.encryptPassword(payload.password, 10);
        payload.password = hash;
        return payload as unknown as User;
    }

    async encryptPassword(plainText: string, saltRounds: number): Promise<string> {
        return await bcrypt.hash(plainText, saltRounds);
    }
}
