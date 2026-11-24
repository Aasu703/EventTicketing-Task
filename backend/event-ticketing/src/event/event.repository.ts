import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service.js';
import { Prisma, EventStatus } from '../generated/prisma/client.js';
import { PublicEventDto } from './dto/public-event.dto.js';
import { PaginationQueryDto } from '../common/pagination/pagination-query.dto.js';

@Injectable()
export class EventsRepository {
  constructor(private prisma: PrismaService) {}

  findById(id: number) {
    return this.prisma.event.findUnique({ where: { id } });
  }

  create(data: Prisma.EventUncheckedCreateInput) {
    return this.prisma.event.create({ data });
  }

  update(id: number, data: Prisma.EventUpdateInput) {
    return this.prisma.event.update({ where: { id }, data });
  }

  setStatus(id: number, status: EventStatus) {
    return this.prisma.event.update({ where: { id }, data: { status } });
  }

  async listPublic(q: PublicEventDto) {
    const where: Prisma.EventWhereInput = {
      status: EventStatus.PUBLISHED,
      startTime: { gt: new Date(), gte: q.startFrom, lte: q.startTo },
      ticketPrice: { gte: q.minPrice, lte: q.maxPrice },
      title: q.search ? { contains: q.search, mode: 'insensitive' } : undefined,
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.event.findMany({
        where,
        orderBy: [{ startTime: 'asc' }, { id: 'asc' }],
        skip: (q.page - 1) * q.limit,
        take: q.limit,
      }),
      this.prisma.event.count({ where }),
    ]);
    return { items, total };
  }

  async listByOrganizer(organizerId: number, q: PaginationQueryDto) {
    const where = { organizerId };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.event.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (q.page - 1) * q.limit,
        take: q.limit,
      }),
      this.prisma.event.count({ where }),
    ]);
    return { items, total };
  }
}