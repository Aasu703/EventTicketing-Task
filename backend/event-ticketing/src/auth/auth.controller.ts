import { Body, Controller, Post } from '@nestjs/common';
import { CreateUserDto } from './register.dto.js';

@Controller('auth')
export class AuthController {
    @Post('/register')
    createUser(
        @Body() createUserDto: CreateUserDto
    ){
        return createUserDto;
    }
}
