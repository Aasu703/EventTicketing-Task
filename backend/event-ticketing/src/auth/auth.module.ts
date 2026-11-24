import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { JwtModule } from '@nestjs/jwt';
import { RolesGuard } from '../roles/roles.guard.js';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from './guard/auth.guard.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
    imports: [
        PrismaModule,
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
    provide : APP_GUARD,
    useClass: AuthGuard,
  },
  {
    provide: APP_GUARD,
    useClass: RolesGuard,
  },
  AuthService],
})
export class AuthModule {}