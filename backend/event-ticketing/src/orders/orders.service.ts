import { Injectable, NotFoundException, BadRequestException,ForbiddenException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service.js';
import { OrdersRepository } from './orders.repository.js';
import { CreateOrderDto } from './dto/create-order.dto.js';
import { PayOrderDto } from './dto/pay-order.dto.js';
import { EventStatus, OrderStatus, PaymentStatus } from '@prisma/client';
import { buildPaginatedResponse } from '../common/pagination/paginate.js';
import { PaginationQueryDto } from '../common/pagination/pagination-query.dto.js';
import { randomBytes } from 'crypto';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private repo: OrdersRepository
  ) {}

  private generateTicketCode(): string {
    return `TKT-${randomBytes(8).toString('hex').toUpperCase()}`;
  }

  async create(dto: CreateOrderDto, customerId: number) {
    const ticketType = await this.prisma.ticketType.findUnique({
      where: { id: dto.ticketTypeId },
      include: { event: true }
    });

    if (!ticketType || ticketType.eventId !== dto.eventId) {
      throw new NotFoundException('Ticket type not found for this event');
    }

    const event = ticketType.event;

    if (event.status !== EventStatus.PUBLISHED) {
      throw new BadRequestException('Event is not published');
    }
    if (event.startTime <= new Date()) {
      throw new BadRequestException('Event has already started');
    }
    if (dto.quantity > event.maxPerOrder) {
      throw new BadRequestException(`Maximum ${event.maxPerOrder} tickets per order`);
    }

    const available = ticketType.quantity - ticketType.sold;
    if (dto.quantity > available) {
      throw new BadRequestException(`Only ${available} tickets available`);
    }

    const unitPrice = ticketType.price;
    const totalAmount = new Prisma.Decimal(unitPrice.toNumber() * dto.quantity);

    const holdExpiresAt = new Date(Date.now() + 15 * 60 * 1000);

    return this.repo.createWithHold({
      customerId,
      eventId: dto.eventId,
      ticketTypeId: dto.ticketTypeId,
      quantity: dto.quantity,
      unitPrice,
      totalAmount,
      holdExpiresAt,
    });
  }

  async pay(orderId: number, customerId: number, dto: PayOrderDto) {
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { hold: true, event: true, ticketType: true }
      });

      if (!order) throw new NotFoundException('Order not found');
      if (order.customerId !== customerId) throw new ForbiddenException('Not your order');
      if (order.status !== OrderStatus.PENDING) throw new BadRequestException('Order not pending');
      if (!order.hold || order.hold.expiresAt < new Date()) {
        if (order.holdId) {
          await this.releaseHoldAndCancel(tx, orderId);
        }
        throw new BadRequestException('Payment window expired');
      }

      const mockProviderRef = `ESEWA-${Date.now()}-${randomBytes(4).toString('hex')}`;

      await tx.payment.create({
        data: {
          orderId,
          customerId,
          amount: order.totalAmount,
          status: PaymentStatus.SUCCESSFUL,
          provider: 'esewa',
          providerRef: mockProviderRef,
          metadata: { mock: true, ...(dto.metadata ? JSON.parse(dto.metadata) : {}) },
        }
      });

      await tx.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.PAID,
          paymentStatus: PaymentStatus.SUCCESSFUL,
          paidAt: new Date(),
          holdId: null,
        }
      });

      const tickets = await Promise.all(
        Array.from({ length: order.quantity }).map(() =>
          tx.ticket.create({
            data: {
              orderId,
              ticketTypeId: order.ticketTypeId,
              eventId: order.eventId,
              customerId,
              code: this.generateTicketCode(),
            }
          })
        )
      );

      if (order.holdId) {
        await tx.ticketHold.delete({ where: { id: order.holdId } });
      }

      return {
        order: { ...order, status: OrderStatus.PAID, paymentStatus: PaymentStatus.SUCCESSFUL },
        tickets,
        payment: { providerRef: mockProviderRef, status: PaymentStatus.SUCCESSFUL }
      };
    });
  }

  async cancel(orderId: number, customerId: number) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { event: true, hold: true }
    });

    if (!order) throw new NotFoundException('Order not found');
    if (order.customerId !== customerId) throw new ForbiddenException('Not your order');
    if (order.status === OrderStatus.CANCELLED) throw new BadRequestException('Already cancelled');
    if (order.status !== OrderStatus.PAID) throw new BadRequestException('Only paid orders can be cancelled');

    const cutoff = new Date(order.event.startTime.getTime() - 24 * 60 * 60 * 1000);
    if (new Date() > cutoff) {
      throw new BadRequestException('Cancellation only allowed 24 hours before event');
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.CANCELLED, cancelledAt: new Date() }
      });

      await tx.ticketType.update({
        where: { id: order.ticketTypeId },
        data: { sold: { decrement: order.quantity } }
      });

      await tx.ticket.deleteMany({ where: { orderId } });

      await tx.payment.create({
        data: {
          orderId,
          customerId,
          amount: order.totalAmount,
          status: PaymentStatus.REFUNDED,
          provider: 'esewa',
          metadata: { refundedAt: new Date().toISOString() }
        }
      });

      if (order.holdId) {
        await tx.ticketHold.delete({ where: { id: order.holdId } });
      }

      return { message: 'Order cancelled, refund initiated' };
    });
  }

  async findMine(customerId: number, q: PaginationQueryDto) {
    const { items, total } = await this.repo.findByCustomer(customerId, q.page, q.limit);
    return buildPaginatedResponse(items, total, q.page, q.limit);
  }

  async findOrganizerOrders(organizerId: number, q: PaginationQueryDto) {
    const { items, total } = await this.repo.findByOrganizer(organizerId, q.page, q.limit);
    return buildPaginatedResponse(items, total, q.page, q.limit);
  }

  private async releaseHoldAndCancel(tx: any, orderId: number) {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { hold: true }
    });
    if (order) {
      await tx.ticketType.update({
        where: { id: order.ticketTypeId },
        data: { sold: { decrement: order.quantity } }
      });
      if (order.holdId) {
        await tx.ticketHold.delete({ where: { id: order.holdId } });
      }
      await tx.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.CANCELLED }
      });
    }
  }

  async cleanupStalePendingOrders() {
    const staleOrders = await this.repo.findStalePendingOrders();
    
    for (const order of staleOrders) {
      await this.prisma.$transaction(async (tx) => {
        await tx.order.update({
          where: { id: order.id },
          data: { status: OrderStatus.CANCELLED }
        });
        await tx.ticketType.update({
          where: { id: order.ticketTypeId },
          data: { sold: { decrement: order.quantity } }
        });
        if (order.holdId) {
          await tx.ticketHold.delete({ where: { id: order.holdId } });
        }
      });
    }
    
    return { cleaned: staleOrders.length };
  }
}