import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { Prisma, EventStatus } from '../generated/prisma/client.js';
import { PublicEventDto } from './dto/public-event.dto.js';
import { PaginationQueryDto } from '../common/pagination/pagination-query.dto.js';

@Injectable()
export class EventsRepository {
  constructor(private prisma: PrismaService) {}

  findById(id: number) {
    return this.prisma.event.findUnique({ where: { id } });
  }

  create(data: Prisma.EventCreateInput) {
    const { ticketTypes, organizerId, ...eventData } = data as any;
    return this.prisma.event.create({
      data: {
        ...eventData,
        organizerId,
        ticketTypes,
      },
      include: { ticketTypes: true },
    });
  }

  update(id: number, data: Prisma.EventUpdateInput) {
    return this.prisma.event.update({ where: { id }, data });
  }

  setStatus(id: number, status: EventStatus) {
    return this.prisma.event.update({ where: { id }, data: { status } });
  }

  async listPublic(q: PublicEventDto) {
    const page = Number(q.page) || 1;
    const limit = Number(q.limit) || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.EventWhereInput = {
      status: EventStatus.PUBLISHED,
      startTime: { gt: new Date() },
      ...(q.startFrom && { gte: new Date(q.startFrom) }),
      ...(q.startTo && { lte: new Date(q.startTo) }),
      ...(q.minPrice !== undefined && { ticketPrice: { gte: q.minPrice } }),
      ...(q.maxPrice !== undefined && { ticketPrice: { lte: q.maxPrice } }),
      ...(q.search && { title: { contains: q.search, mode: 'insensitive' as const } }),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.event.findMany({
        where,
        orderBy: [{ startTime: 'asc' }, { id: 'asc' }],
        skip,
        take: limit,
      }),
      this.prisma.event.count({ where }),
    ]);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async listByOrganizer(organizerId: number, q: PaginationQueryDto) {
    const page = Number(q.page) || 1;
    const limit = Number(q.limit) || 10;
    const skip = (page - 1) * limit;

    const where = { organizerId };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.event.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.event.count({ where }),
    ]);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  // TicketType methods
  async createTicketType(data: Prisma.TicketTypeUncheckedCreateInput) {
    return this.prisma.ticketType.create({ data });
  }

  async findTicketTypeById(id: number) {
    return this.prisma.ticketType.findUnique({ 
      where: { id },
      include: { event: true }
    });
  }

  async findTicketTypesByEvent(eventId: number) {
    return this.prisma.ticketType.findMany({
      where: { eventId },
      include: { event: true }
    });
  }

  async updateTicketType(id: number, data: Prisma.TicketTypeUpdateInput) {
    return this.prisma.ticketType.update({ where: { id }, data, include: { event: true } });
  }

  async deleteTicketType(id: number) {
    return this.prisma.ticketType.delete({ where: { id } });
  }

  async findEventsToComplete(now: Date) {
    return this.prisma.event.findMany({
      where: {
        status: EventStatus.PUBLISHED,
        endTime: { lt: now },
      },
      select: { id: true, organizerId: true },
    });
  }
}