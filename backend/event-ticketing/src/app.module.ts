import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './auth/auth.module.js';
import { DashboardController } from './dashboard/dashboard.controller.js';
import { DashboardModule } from './dashboard/dashboard.module.js';
// import { EventController } from './event/event.controller.js';
import { RedisModule } from './redis/redis.module.js';
import { EventModule } from './event/event.module.js';
import { AuthGuard } from './auth/guard/auth.guard.js';
import { APP_GUARD } from '@nestjs/core';
import { RolesGuard } from './roles/roles.guard.js';
import { AuthService } from './auth/auth.service.js';
import { PrismaService } from './prisma.service.js';
import { EventService } from './event/event.service.js';
import { OrdersModule } from './orders/orders.module.js';


@Module({
  imports: [
    AuthModule,
    DashboardModule,
    EventModule,
    RedisModule,
    OrdersModule
  ],
  controllers: [AppController, DashboardController],
 providers: [{
     provide : APP_GUARD,
     useClass: AuthGuard,
   },
   {
     provide: APP_GUARD,
     useClass: RolesGuard,
   },
   AuthService, PrismaService, EventService],
})
export class AppModule {}
