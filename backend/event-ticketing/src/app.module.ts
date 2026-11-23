import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './auth/auth.module.js';
import { DashboardController } from './dashboard/dashboard.controller.js';
import { DashboardModule } from './dashboard/dashboard.module.js';
import { RedisModule } from './redis/redis.module.js';
import { EventModule } from './event/event.module.js';


@Module({
  imports: [
    AuthModule,
    DashboardModule,
    EventModule,
    RedisModule
  ],
  controllers: [AppController, DashboardController],
  providers: [AppService],
})
export class AppModule {}
