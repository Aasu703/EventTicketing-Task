import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './register.dto.js';
import { User } from './user.model.js';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma.service.js';
import { JwtService } from '@nestjs/jwt';
import { hash } from 'bcryptjs';

@Injectable()
export class AuthService {
    constructor(private readonly prisma: PrismaService, private readonly jwtService: JwtService) {}
        
    async registerUser(payload: CreateUserDto): Promise<User> {
        const hash = await this.encryptPassword(payload.password, 10);
        // save hash to db
        payload.password = hash;
        
        return await this.prisma.user.create({
            data: {
                username: payload.username,
                email: payload.email,
                phoneNumber: payload.phoneNumber,
                password: hash,
               
            },
            select: {
                id: true,
                username: true,
                email: true,
                phoneNumber: true,
                role: true
                
            }
        })
    }

   async encryptPassword(plainText: string, saltRounds: number): Promise<string> {
    return await bcrypt.hash(plainText, saltRounds);
   }
}
   
