import { Module } from '@nestjs/common';
import { TicketsController } from './tickets.controller.js';
import { TicketsService } from './tickets.service.js';
import { TicketsRepository } from './tickets.repository.js';
import { PrismaService } from '../prisma.service.js';

@Module({
  controllers: [TicketsController],
  providers: [TicketsService, TicketsRepository, PrismaService],
  exports: [TicketsService],
})
export class TicketsModule {}