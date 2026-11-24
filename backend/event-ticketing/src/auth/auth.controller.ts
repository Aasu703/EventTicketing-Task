import { Body, Controller, Get, Post, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CreateUserDto } from './dto/register.dto.js';
import { AuthService } from './auth.service.js';
import { LoginDto } from './dto/login.dto.js';
import { Public } from '../common/decorator/public.decorator.js';
import { Role } from '../common/decorator/roles.decorator.js';
import { Roles } from '../roles/roles.enum.js';
import type { AuthenicatedRequest } from '../common/types/authenticate-request.js';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private userService: AuthService) {}

  @Public()
  @Post('/register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User registered successfully', example: { id: 1, username: 'john', email: 'john@example.com', phoneNumber: '9876543210', role: ['CUSTOMER'] } })
  @ApiResponse({ status: 409, description: 'User already exists' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  async createUser(@Body() createUserDto: CreateUserDto) {
    return await this.userService.registerUser(createUserDto);
  }

  @Public()
  @Post('/login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login user and get JWT token' })
  @ApiResponse({ status: 200, description: 'Login successful', example: { accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' } })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async loginUser(@Body() loginDto: LoginDto) {
    return await this.userService.loginUser(loginDto);
  }

  @Role(Roles.Customer)
  @Get('/profile')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'User profile', example: { sub: 1, email: 'john@example.com', roles: ['CUSTOMER'] } })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getProfile(@Req() req: AuthenicatedRequest) {
    return req.user;
  }
}