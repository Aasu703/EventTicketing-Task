import { Module } from '@nestjs/common';
import { EventService } from './event.service.js';
import { EventController } from './event.controller.js';
import { EventsRepository } from './event.repository.js';
import { EventsCache } from './events-cache.js';
import { RedisModule } from '../redis/redis.module.js';

@Module({
  imports: [RedisModule],
  controllers: [EventController],
  providers: [EventService, EventsRepository, EventsCache],
})
export class EventModule {}