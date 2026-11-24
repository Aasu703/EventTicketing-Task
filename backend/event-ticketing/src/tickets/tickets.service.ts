import { Injectable, NotFoundException, BadRequestException,ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { TicketsRepository } from './tickets.repository.js';
import { EventStatus, OrderStatus } from '@prisma/client';

@Injectable()
export class TicketsService {
  constructor(
    private prisma: PrismaService,
    private repo: TicketsRepository
  ) {}

  async checkIn(code: string, organizerId: number) {
    const ticket = await this.repo.findByCode(code);
    
    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    if (ticket.event.organizerId !== organizerId) {
      throw new ForbiddenException('You can only check in tickets for your own events');
    }

    if (ticket.event.status === EventStatus.CANCELLED) {
      throw new BadRequestException('Event is cancelled');
    }

    if (ticket.order.status === OrderStatus.CANCELLED) {
      throw new BadRequestException('Order is cancelled');
    }

    if (ticket.checkedIn) {
      throw new BadRequestException(
        `Ticket already checked in at ${ticket.checkedInAt?.toISOString() ?? 'unknown time'}`
      );
    }

    return this.repo.checkIn(ticket.id, organizerId);
  }

  async getTicketByCode(code: string) {
    const ticket = await this.repo.findByCode(code);
    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }
    return ticket;
  }

  async getMyTickets(customerId: number) {
    return this.repo.findByCustomer(customerId);
  }

  async getEventTickets(eventId: number, organizerId: number) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId }
    });
    if (!event) throw new NotFoundException('Event not found');
    if (event.organizerId !== organizerId) {
      throw new ForbiddenException('Not your event');
    }
    return this.repo.findByEventId(eventId);
  }

  async getCheckInStats(eventId: number, organizerId: number) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId }
    });
    if (!event) throw new NotFoundException('Event not found');
    if (event.organizerId !== organizerId) {
      throw new ForbiddenException('Not your event');
    }
    return this.repo.getCheckInStats(eventId);
  }
}