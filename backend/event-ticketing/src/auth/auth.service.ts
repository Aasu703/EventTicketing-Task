import { Injectable, UnauthorizedException } from '@nestjs/common';
import { CreateUserDto } from './dto/register.dto.js';
import { User } from './user.model.js';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma.service.js';
import { JwtService } from '@nestjs/jwt';
import { hash } from 'bcryptjs';
import { LoginDto } from './dto/login.dto.js';

@Injectable()
export class AuthService {
    constructor(private readonly prisma: PrismaService, private readonly jwtService: JwtService) {}
  
    async registerUser(payload: CreateUserDto): Promise<User> {
        const hash = await this.encryptPassword(payload.password, 10);
        // save hash to db
        payload.password = hash;
        try{
        return await this.prisma.user.create({
            data: {
                username: payload.username,
                email: payload.email,
                phoneNumber: payload.phoneNumber,
                password: hash,
                role: payload.role ? [payload.role] : ['CUSTOMER'] 
            },
            select: {
                id: true,
                username: true,
                email: true,
                phoneNumber: true,
                role: true
                
            }
        })
    } catch (error : any){
        if(error?.code === 'P2002') {
            throw new Error('User already exists');
        }
        throw error;
    }
        
    }

   async encryptPassword(plainText: string, saltRounds: number) {
    return await bcrypt.hash(plainText, saltRounds);
   }

    async decryptPassword(plainText: string, hash: string) {
    return await bcrypt.compare(plainText, hash);
   }

   async loginUser(loginDTO: LoginDto): Promise<{accessToken: string}>{ 
    // user getby email
    const user = await this.prisma.user.findFirst({
        where:{
            email: loginDTO.email
        }
    })
    // no user found throw error
    if(!user) {
        throw new UnauthorizedException();
    }
    // decrypt password and compare
    const isMatched = await this.decryptPassword(loginDTO.password, user.password);
    if(!isMatched){
        throw new UnauthorizedException("Invalid password");
    }

    const payload = {email: user.email, sub: user.id, roles: user.role};

    // if password match return jwt token
    const accessToken = await this.jwtService.signAsync({
        email: user.email,
        id: user.id,
        roles: user.role,
    })
    return {accessToken};

   }
}
   
