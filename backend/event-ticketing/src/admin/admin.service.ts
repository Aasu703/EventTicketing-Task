import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { OrderStatus, PaymentStatus, EventStatus, Role } from '@prisma/client';
import { Prisma } from '@prisma/client';

export interface DashboardFilters {
  startDate?: Date;
  endDate?: Date;
  organizerId?: number;
}

export interface UserFilters {
  page: number;
  limit: number;
  role?: string;
  search?: string;
  isActive?: boolean;
}

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  private buildDateFilter(filters: DashboardFilters) {
    const where: any = {};
    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = filters.startDate;
      if (filters.endDate) where.createdAt.lte = filters.endDate;
    }
    return where;
  }

  private buildOrderWhere(filters: DashboardFilters) {
    const where = this.buildDateFilter(filters);
    if (filters.organizerId) {
      where.event = { organizerId: filters.organizerId };
    }
    return where;
  }

  private buildEventWhere(filters: DashboardFilters) {
    const where = this.buildDateFilter(filters);
    if (filters.organizerId) {
      where.organizerId = filters.organizerId;
    }
    return where;
  }

  async getDashboard(filters: DashboardFilters = {}) {
    const orderWhere = this.buildOrderWhere(filters);
    const eventWhere = this.buildEventWhere(filters);
    const paymentWhere = this.buildDateFilter(filters);

    // Parallel queries for performance
    const [
      totalTicketsSold,
      totalRevenue,
      paymentsByStatus,
      totalOrders,
      cancelledOrders,
      eventsByStatus,
      totalOrganizers,
      totalCustomers,
      topEvents,
      topOrganizers,
    ] = await Promise.all([
      // Total tickets sold (from PAID orders)
      this.prisma.order.aggregate({
        where: {
          ...orderWhere,
          status: OrderStatus.PAID,
          paymentStatus: PaymentStatus.SUCCESSFUL,
        },
        _sum: { quantity: true },
      }),

      // Total revenue
      this.prisma.order.aggregate({
        where: {
          ...orderWhere,
          status: OrderStatus.PAID,
          paymentStatus: PaymentStatus.SUCCESSFUL,
        },
        _sum: { totalAmount: true },
      }),

      // Payments by status
      this.prisma.payment.groupBy({
        by: ['status'],
        where: paymentWhere,
        _count: { id: true },
        _sum: { amount: true },
      }),

      // Total orders
      this.prisma.order.count({ where: orderWhere }),

      // Cancelled orders
      this.prisma.order.count({
        where: { ...orderWhere, status: OrderStatus.CANCELLED },
      }),

      // Events by status
      this.prisma.event.groupBy({
        by: ['status'],
        where: eventWhere,
        _count: { id: true },
      }),

      // Total organizers
      this.prisma.user.count({
        where: { role: { has: Role.ORGANIZER } },
      }),

      // Total customers
      this.prisma.user.count({
        where: { role: { has: Role.CUSTOMER } },
      }),

      // Top 5 events by revenue
      this.getTopEventsByRevenue(filters, 5),

      // Top 5 organizers by revenue
      this.getTopOrganizersByRevenue(filters, 5),
    ]);

    return {
      totalTicketsSold: totalTicketsSold._sum.quantity || 0,
      totalRevenue: totalRevenue._sum.totalAmount?.toNumber() || 0,
      paymentsByStatus: this.formatPaymentsByStatus(paymentsByStatus),
      totalOrders,
      cancelledOrders,
      eventsByStatus: this.formatEventsByStatus(eventsByStatus),
      totalOrganizers,
      totalCustomers,
      topEvents,
      topOrganizers,
      filters: {
        startDate: filters.startDate?.toISOString(),
        endDate: filters.endDate?.toISOString(),
        organizerId: filters.organizerId,
      },
    };
  }

  private formatPaymentsByStatus(payments: any[]) {
    const result: Record<string, { count: number; totalAmount: number }> = {
      SUCCESSFUL: { count: 0, totalAmount: 0 },
      FAILED: { count: 0, totalAmount: 0 },
      REFUNDED: { count: 0, totalAmount: 0 },
    };
    for (const p of payments) {
      result[p.status] = {
        count: p._count.id,
        totalAmount: p._sum.amount?.toNumber() || 0,
      };
    }
    return result;
  }

  private formatEventsByStatus(events: any[]) {
    const result: Record<string, number> = {
      DRAFT: 0,
      PUBLISHED: 0,
      COMPLETED: 0,
      CANCELLED: 0,
    };
    for (const e of events) {
      result[e.status] = e._count.id;
    }
    return result;
  }

  private async getTopEventsByRevenue(filters: DashboardFilters, limit: number) {
    const where = this.buildOrderWhere(filters);
    where.status = OrderStatus.PAID;
    where.paymentStatus = PaymentStatus.SUCCESSFUL;

    const results = await this.prisma.order.groupBy({
      by: ['eventId'],
      where,
      _sum: { totalAmount: true, quantity: true },
      orderBy: { _sum: { totalAmount: 'desc' } },
      take: limit,
    });

    if (results.length === 0) return [];

    const eventIds = results.map(r => r.eventId);
    const events = await this.prisma.event.findMany({
      where: { id: { in: eventIds } },
      select: { id: true, title: true, organizer: { select: { id: true, username: true } } },
    });

    const eventMap = new Map(events.map(e => [e.id, e]));

    return results.map(r => {
      const event = eventMap.get(r.eventId);
      return {
        eventId: r.eventId,
        title: event?.title || 'Unknown',
        organizer: event?.organizer || { id: 0, username: 'Unknown' },
        revenue: r._sum.totalAmount?.toNumber() || 0,
        ticketsSold: r._sum.quantity || 0,
      };
    });
  }

  private async getTopOrganizersByRevenue(filters: DashboardFilters, limit: number) {
    const where = this.buildOrderWhere(filters);
    where.status = OrderStatus.PAID;
    where.paymentStatus = PaymentStatus.SUCCESSFUL;

    const results = await this.prisma.order.groupBy({
      by: ['eventId'],
      where,
      _sum: { totalAmount: true, quantity: true },
    });

    if (results.length === 0) return [];

    const eventIds = results.map(r => r.eventId);
    const events = await this.prisma.event.findMany({
      where: { id: { in: eventIds } },
      select: { id: true, organizerId: true },
    });

    const eventToOrganizer = new Map(events.map(e => [e.id, e.organizerId]));
    const organizerRevenue = new Map<number, { revenue: Prisma.Decimal; ticketsSold: number }>();

    for (const r of results) {
      const organizerId = eventToOrganizer.get(r.eventId);
      if (!organizerId) continue;
      const existing = organizerRevenue.get(organizerId) || { revenue: new Prisma.Decimal(0), ticketsSold: 0 };
      existing.revenue = existing.revenue.plus(r._sum.totalAmount || 0);
      existing.ticketsSold += r._sum.quantity || 0;
      organizerRevenue.set(organizerId, existing);
    }

    const organizerIds = Array.from(organizerRevenue.keys());
    const organizers = await this.prisma.user.findMany({
      where: { id: { in: organizerIds } },
      select: { id: true, username: true, email: true },
    });
    const organizerMap = new Map(organizers.map(o => [o.id, o]));

    return Array.from(organizerRevenue.entries())
      .map(([organizerId, data]) => ({
        organizerId,
        username: organizerMap.get(organizerId)?.username || 'Unknown',
        email: organizerMap.get(organizerId)?.email || 'Unknown',
        revenue: data.revenue.toNumber(),
        ticketsSold: data.ticketsSold,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limit);
  }

  // User Management
  async getUsers(filters: UserFilters) {
    const { page, limit, role, search, isActive } = filters;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (role) {
      where.role = { has: role as Role };
    }

    if (search) {
      where.OR = [
        { username: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          username: true,
          email: true,
          phoneNumber: true,
          role: true,
          createdAt: true,
          isActive: true,
          _count: {
            select: { organizedEvents: true, orders: true, tickets: true },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users.map(u => ({
        ...u,
        _count: undefined,
        eventsCount: u._count.organizedEvents,
        ordersCount: u._count.orders,
        ticketsCount: u._count.tickets,
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1,
      },
    };
  }

  async getUserById(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        email: true,
        phoneNumber: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        isActive: true,
        organizedEvents: { select: { id: true, title: true, status: true } },
        orders: { select: { id: true, status: true, totalAmount: true, createdAt: true } },
        tickets: { select: { id: true, code: true, checkedIn: true, event: { select: { id: true, title: true } } } },
        _count: { select: { organizedEvents: true, orders: true, tickets: true } },
      },
    });

    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateUserRole(id: number, roles: string[]) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    const validRoles = roles.filter(r => Object.values(Role).includes(r as Role)) as Role[];
    if (validRoles.length !== roles.length) {
      throw new Error('Invalid role provided');
    }

    return this.prisma.user.update({
      where: { id },
      data: { role: validRoles },
      select: { id: true, username: true, email: true, role: true, updatedAt: true },
    });
  }

  async toggleUserStatus(id: number) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    return this.prisma.user.update({
      where: { id },
      data: { isActive: !user.isActive },
      select: { id: true, username: true, isActive: true },
    });
  }

  async deleteUser(id: number) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    // Soft delete - deactivate user
    await this.prisma.user.update({
      where: { id },
      data: { isActive: false },
    });

    return { message: 'User deactivated successfully' };
  }
}