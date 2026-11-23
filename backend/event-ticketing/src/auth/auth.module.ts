import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { PrismaService } from '../prisma.service.js';
import { JwtModule } from '@nestjs/jwt';
import { RolesGuard } from '../roles/roles.guard.js';
import { APP_GUARD } from '@nestjs/core';

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
  providers: [{
    provide: APP_GUARD,
    useClass: RolesGuard,
  },
  AuthService, PrismaService],
})
export class AuthModule {}
