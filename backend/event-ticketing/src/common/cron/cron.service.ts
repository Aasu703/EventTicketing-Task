import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EventService } from '../../event/event.service.js';
import { OrdersService } from '../../orders/orders.service.js';
  
@Injectable()
export class CronService {
  constructor(
    private eventService: EventService,
    private ordersService: OrdersService
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async markEventsCompleted() {
    try {
      const now = new Date();
      const eventsToComplete = await this.eventService.findEventsToComplete(now);
      
      let completedCount = 0;
      for (const event of eventsToComplete) {
        await this.eventService.complete(event.id, event.organizerId);
        completedCount++;
      }

      if (completedCount > 0) {
        console.log(`[Cron] Marked ${completedCount} events as COMPLETED`);
      }
      return { completed: completedCount };
    } catch (error) {
      console.error('[Cron] Error marking events completed:', error);
      return { error: 'Failed to mark events completed' };
    }
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async cleanupStaleOrders() {
    try {
      const result = await this.ordersService.cleanupStalePendingOrders();
      if (result.cleaned > 0) {
        console.log(`[Cron] Cleaned up ${result.cleaned} stale PENDING orders`);
      }
      return result;
    } catch (error) {
      console.error('[Cron] Error cleaning stale orders:', error);
      return { error: 'Failed to cleanup stale orders' };
    }
  }
}