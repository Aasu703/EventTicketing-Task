import { Body, Controller, Get, Post, UseGuards, Req} from '@nestjs/common';
import { CreateUserDto } from './dto/register.dto.js';
import { AuthService } from './auth.service.js';
import { LoginDto } from './dto/login.dto.js';
import { AuthGuard } from './guard/auth.guard.js';
import * as express from 'express';
import { Role} from '../common/decorator/roles.decorator.js'
import { Roles } from '../roles/roles.enum.js';


interface AuthenticatedRequest extends express.Request {
    user: {sub: string, email:string};
}
@Controller('auth')
export class AuthController {
    constructor(private userService : AuthService) {}
    @Post('/register')
    async acreateUser(
        @Body() createUserDto: CreateUserDto
    ){
        return await this.userService.registerUser(createUserDto);
    }

    @Post('/login')
    async loginUser(
        @Body() loginDto : LoginDto
    ){
        return await this.userService.loginUser(loginDto);
    }

    @UseGuards(AuthGuard)
    @Role(Roles.Admin)
    @Get('/profile')
    async getProfile(@Req() req: AuthenticatedRequest) {
        return req.user;    
    }
    

}

