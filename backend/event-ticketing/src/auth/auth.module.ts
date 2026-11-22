import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { PrismaService } from '../prisma.service.js';
import { JwtModule } from '@nestjs/jwt';

@Module({
    imports: [
        JwtModule.registerAsync({
            global: true,
            useFactory: () => ({
                secret: process.env.JWT_SECRET,
                signOptions: { expiresIn: '1h' },
            }),
        })
    ],
  controllers: [AuthController],
  providers: [AuthService, PrismaService],
})
export class AuthModule {}
