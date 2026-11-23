import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './auth/auth.module.js';
import { DashboardController } from './dashboard/dashboard.controller.js';
import { DashboardModule } from './dashboard/dashboard.module.js';
import { EventController } from './event/event.controller.js';
import { EventModule } from './event/event.module.js';
import { ServiceModule } from './service/service.module.js';

@Module({
  imports: [
    AuthModule,
    DashboardModule,
    EventModule,
    ServiceModule,
  ],
  controllers: [AppController, DashboardController, EventController],
  providers: [AppService],
})
export class AppModule {}
