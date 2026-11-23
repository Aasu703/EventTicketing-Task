import { Module } from '@nestjs/common';
import { EventService } from './event.service.js';

@Module({
  providers: [EventService]
})
export class EventModule {}
