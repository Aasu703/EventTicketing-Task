import { Body, Controller, Post } from '@nestjs/common';
import { CreateUserDto } from './register.dto.js';
import { AuthService } from './auth.service.js';
import { LoginDto } from './login.dto.js';

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
    
}
