import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service.js';


@Injectable()
export class TicketsRepository {
  constructor(private prisma: PrismaService) {}

  async findByCode(code: string) {
    return this.prisma.ticket.findUnique({
      where: { code },
      include: {
        event: true,
        ticketType: true,
        order: true,
        customer: true,
      }
    });
  }

  async findByOrderId(orderId: number) {
    return this.prisma.ticket.findMany({
      where: { orderId },
      include: { event: true, ticketType: true }
    });
  }

  async findByEventId(eventId: number) {
    return this.prisma.ticket.findMany({
      where: { eventId },
      include: { ticketType: true, order: true, customer: true }
    });
  }

  async checkIn(ticketId: number, checkedInBy: number) {
    return this.prisma.ticket.update({
      where: { id: ticketId },
      data: {
        checkedIn: true,
        checkedInAt: new Date(),
        checkedInBy,
      },
      include: { event: true, ticketType: true }
    });
  }

  async findByCustomer(customerId: number) {
    return this.prisma.ticket.findMany({
      where: { customerId },
      include: { event: true, ticketType: true, order: true }
    });
  }

  async getCheckInStats(eventId: number) {
    const [total, checkedIn] = await this.prisma.$transaction([
      this.prisma.ticket.count({ where: { eventId } }),
      this.prisma.ticket.count({ where: { eventId, checkedIn: true } }),
    ]);
    return { total, checkedIn, pending: total - checkedIn };
  }
}