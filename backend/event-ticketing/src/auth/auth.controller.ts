import { Body, Controller, Post } from '@nestjs/common';
import { CreateUserDto } from './register.dto.js';
import { AuthService } from './auth.service.js';

@Controller('auth')
export class AuthController {
    constructor(private userService : AuthService) {}
    @Post('/register')
    async acreateUser(
        @Body() createUserDto: CreateUserDto
    ){
        return await this.userService.registerUser(createUserDto);
    }
    // @Post('/login')
    // async loginUser(
    //     @Body() createUserDto: CreateUserDto
    // ){
    //     return await this.userService.loginUser(createUserDto);
    // }
}
