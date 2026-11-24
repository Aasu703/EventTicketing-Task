import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { OrderStatus, PaymentStatus, Ticket, EventStatus } from '@prisma/client';
import { Prisma } from '@prisma/client';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getEventReport(eventId: number, organizerId: number) {
    // Verify event belongs to organizer
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      select: { organizerId: true }
    });

    if (!event) throw new NotFoundException('Event not found');
    if (event.organizerId !== organizerId) throw new ForbiddenException('Not your event');

    // Get all paid orders for this event
    const paidOrders = await this.prisma.order.findMany({
      where: {
        eventId,
        status: OrderStatus.PAID,
        paymentStatus: PaymentStatus.SUCCESSFUL,
      },
      include: { ticketType: true }
    });

    // Calculate tickets sold per ticket type
    const ticketsSoldByType = paidOrders.reduce((acc, order) => {
      const typeId = order.ticketTypeId;
      if (!acc[typeId]) {
        acc[typeId] = { 
          ticketTypeId: typeId, 
          name: order.ticketType.name,
          ticketsSold: 0,
          revenue: new Prisma.Decimal(0)
        };
      }
      acc[typeId].ticketsSold += order.quantity;
      acc[typeId].revenue = acc[typeId].revenue.plus(order.totalAmount);
      return acc;
    }, {} as Record<number, { ticketTypeId: number; name: string; ticketsSold: number; revenue: Prisma.Decimal }>);

    const totalTicketsSold = paidOrders.reduce((sum, o) => sum + o.quantity, 0);
    const totalRevenue = paidOrders.reduce((sum, o) => sum.plus(o.totalAmount), new Prisma.Decimal(0));

    // Get check-in stats
    const checkInStats = await this.prisma.ticket.aggregate({
      where: { eventId },
      _count: { id: true }
    });

    const checkedInCount = await this.prisma.ticket.count({
      where: { eventId, checkedIn: true }
    });

    return {
      eventId,
      totalTicketsSold,
      totalRevenue: totalRevenue.toNumber(),
      ticketsByType: Object.values(ticketsSoldByType).map(t => ({
        ticketTypeId: t.ticketTypeId,
        name: t.name,
        ticketsSold: t.ticketsSold,
        revenue: t.revenue.toNumber()
      })),
      checkIns: {
        total: checkInStats._count.id,
        checkedIn: checkedInCount,
        pending: checkInStats._count.id - checkedInCount
      }
    };
  }

  async getOrganizerReports(organizerId: number) {
    const events = await this.prisma.event.findMany({
      where: { organizerId },
      select: { id: true, title: true, status: true, startTime: true, endTime: true }
    });

    const reports = await Promise.all(
      events.map(async (event) => {
        const report = await this.getEventReport(event.id, organizerId);
        return {
          title: event.title,
          status: event.status,
          startTime: event.startTime,
          endTime: event.endTime,
          ...report
        };
      })
    );

    // Summary across all events
    const totalEvents = events.length;
    const publishedEvents = events.filter(e => e.status === EventStatus.PUBLISHED).length;
    const totalTicketsSold = reports.reduce((sum, r) => sum + r.totalTicketsSold, 0);
    const totalRevenue = reports.reduce((sum, r) => sum + r.totalRevenue, 0);
    const totalCheckIns = reports.reduce((sum, r) => sum + r.checkIns.checkedIn, 0);

    return {
      summary: {
        totalEvents,
        publishedEvents,
        totalTicketsSold,
        totalRevenue,
        totalCheckIns
      },
      events: reports
    };
  }

  async getEventRevenueByDateRange(eventId: number, organizerId: number, startDate: Date, endDate: Date) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      select: { organizerId: true }
    });

    if (!event) throw new NotFoundException('Event not found');
    if (event.organizerId !== organizerId) throw new ForbiddenException('Not your event');

    const paidOrders = await this.prisma.order.findMany({
      where: {
        eventId,
        status: OrderStatus.PAID,
        paymentStatus: PaymentStatus.SUCCESSFUL,
        paidAt: {
          gte: startDate,
          lte: endDate
        }
      },
      orderBy: { paidAt: 'asc' },
      include: { ticketType: true }
    });

    const dailyRevenue = paidOrders.reduce((acc, order) => {
      const date = order.paidAt!.toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = { date, revenue: new Prisma.Decimal(0), ticketsSold: 0 };
      }
      acc[date].revenue = acc[date].revenue.plus(order.totalAmount);
      acc[date].ticketsSold += order.quantity;
      return acc;
    }, {} as Record<string, { date: string; revenue: Prisma.Decimal; ticketsSold: number }>);

    return {
      eventId,
      dateRange: { start: startDate.toISOString(), end: endDate.toISOString() },
      dailyRevenue: Object.values(dailyRevenue).map(d => ({
        date: d.date,
        revenue: d.revenue.toNumber(),
        ticketsSold: d.ticketsSold
      })),
      totalRevenue: paidOrders.reduce((sum, o) => sum.plus(o.totalAmount), new Prisma.Decimal(0)).toNumber(),
      totalTicketsSold: paidOrders.reduce((sum, o) => sum + o.quantity, 0)
    };
  }
}