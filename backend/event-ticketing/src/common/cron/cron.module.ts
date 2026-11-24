import { Module } from '@nestjs/common';
import { CronService } from './cron.service.js';
import { EventModule } from '../../event/event.module.js';
import { OrdersModule } from '../../orders/orders.module.js';

@Module({
  imports: [EventModule, OrdersModule],
  providers: [CronService],
  exports: [CronService],
})
export class CronModule {}