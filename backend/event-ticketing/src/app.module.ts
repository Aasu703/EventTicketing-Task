import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './auth/auth.module.js';
import { DashboardController } from './dashboard/dashboard.controller.js';
import { DashboardModule } from './dashboard/dashboard.module.js';
import { RedisModule } from './redis/redis.module.js';
import { EventModule } from './event/event.module.js';
import { OrdersModule } from './orders/orders.module.js';
import { TicketsModule } from './tickets/tickets.module.js';
import { CronModule } from './common/cron/cron.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { AuthGuard } from './auth/guard/auth.guard.js';
import { APP_GUARD } from '@nestjs/core';
import { RolesGuard } from './roles/roles.guard.js';
import { AuthService } from './auth/auth.service.js';


@Module({
  imports: [
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    DashboardModule,
    EventModule,
    RedisModule,
    OrdersModule,
    TicketsModule,
    CronModule
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
    AuthService, AppService],
})
export class AppModule {}