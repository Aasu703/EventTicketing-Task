import { Module } from '@nestjs/common';
import { EventService } from './event.service.js';
import { EventController } from './event.controller.js';
import { EventsRepository } from './event.repository.js';
import { PrismaService } from '../prisma.service.js';
import { EventsCache } from './events-cache.js';

@Module({
  controllers: [EventController],
  providers: [EventService, EventsRepository, EventsCache, PrismaService],
})
export class EventModule {}
