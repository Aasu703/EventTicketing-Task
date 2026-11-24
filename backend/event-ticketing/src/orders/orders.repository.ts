import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { Prisma, OrderStatus, PaymentStatus } from '../generated/prisma/client.js';

@Injectable()
export class OrdersRepository {
  constructor(private prisma: PrismaService) {}

  // Create order + hold in transaction
  async createWithHold(data: {
    customerId: number;
    eventId: number;
    ticketTypeId: number;
    quantity: number;
    unitPrice: Prisma.Decimal;
    totalAmount: Prisma.Decimal;
    holdExpiresAt: Date;
  }) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Create TicketHold first
      const hold = await tx.ticketHold.create({
        data: {
          eventId: data.eventId,
          ticketTypeId: data.ticketTypeId,
          customerId: data.customerId,
          quantity: data.quantity,
          expiresAt: data.holdExpiresAt,
        }
      });

      // 2. Create Order with holdId
      const order = await tx.order.create({
        data: {
          customerId: data.customerId,
          eventId: data.eventId,
          ticketTypeId: data.ticketTypeId,
          quantity: data.quantity,
          unitPrice: data.unitPrice,
          totalAmount: data.totalAmount,
          status: OrderStatus.PENDING,
          paymentStatus: PaymentStatus.FAILED,
          holdId: hold.id,
        },
        include: { hold: true, event: true, ticketType: true }
      });

      return order;
    });
  }

  // Find by ID with all relations
  async findByIdWithRelations(id: number) {
    return this.prisma.order.findUnique({
      where: { id },
      include: { hold: true, event: true, ticketType: true, tickets: true, payment: true }
    });
  }

  // Customer's orders
  async findByCustomer(customerId: number, page: number, limit: number) {
    const where = { customerId };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { event: true, ticketType: true, tickets: true, payment: true }
      }),
      this.prisma.order.count({ where }),
    ]);
    return { items, total };
  }

  // Organizer's orders (via event organizerId)
  async findByOrganizer(organizerId: number, page: number, limit: number) {
    const where = { event: { organizerId } };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { event: true, ticketType: true, customer: true, tickets: true, payment: true }
      }),
      this.prisma.order.count({ where }),
    ]);
    return { items, total };
  }

  // Update order status + payment in transaction
  async updateStatusAndPayment(
    orderId: number,
    status: OrderStatus,
    paymentData?: {
      paymentStatus: PaymentStatus;
      paidAt?: Date;
      cancelledAt?: Date;
      providerRef?: string;
      metadata?: Prisma.InputJsonValue;
    }
  ) {
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.update({
        where: { id: orderId },
        data: {
          status,
          paymentStatus: paymentData?.paymentStatus,
          paidAt: paymentData?.paidAt,
          cancelledAt: paymentData?.cancelledAt,
          holdId: null,
        }
      });

      if (paymentData) {
        await tx.payment.upsert({
          where: { orderId },
          update: {
            status: paymentData.paymentStatus,
            providerRef: paymentData.providerRef,
            metadata: paymentData.metadata,
          },
          create: {
            orderId,
            customerId: order.customerId,
            amount: order.totalAmount,
            status: paymentData.paymentStatus,
            provider: 'esewa',
            providerRef: paymentData.providerRef,
            metadata: paymentData.metadata,
          }
        });
      }

      return order;
    });
  }

  // Decrement ticketType.sold (on cancel/expire)
  async decrementTicketTypeSold(ticketTypeId: number, quantity: number) {
    return this.prisma.ticketType.update({
      where: { id: ticketTypeId },
      data: { sold: { decrement: quantity } }
    });
  }

  // Delete tickets for an order
  async deleteTickets(orderId: number) {
    return this.prisma.ticket.deleteMany({ where: { orderId } });
  }

  // Delete hold
  async deleteHold(holdId: number) {
    return this.prisma.ticketHold.delete({ where: { id: holdId } });
  }

  // Find stale PENDING orders (for cron)
  async findStalePendingOrders() {
    return this.prisma.order.findMany({
      where: {
        status: OrderStatus.PENDING,
        hold: { expiresAt: { lt: new Date() } }
      },
      include: { hold: true }
    });
  }
}