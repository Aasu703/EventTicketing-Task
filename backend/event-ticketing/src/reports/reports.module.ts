import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller.js';
import { ReportsService } from './reports.service.js';
import { OrdersModule } from '../orders/orders.module.js';
import { TicketsModule } from '../tickets/tickets.module.js';

@Module({
  imports: [OrdersModule, TicketsModule],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}