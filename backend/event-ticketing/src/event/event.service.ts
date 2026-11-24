import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, EventStatus } from '@prisma/client';
import { EventsRepository } from './event.repository.js';
import { EventsCache } from './events-cache.js';
import { CreateEventDto, TicketTypeDto } from './dto/create.event.dto.js';
import { UpdateEventDto } from './dto/update-event.dto.js';
import { PublicEventDto } from './dto/public-event.dto.js';
import { PaginationQueryDto } from '../common/pagination/pagination-query.dto.js';
import { buildPaginatedResponse } from '../common/pagination/paginate.js';
import { TicketTypeResponseDto } from '../tickets/dto/ticket-type-response.dto.js';


const TRANSITIONS: Record<EventStatus, EventStatus[]> = {
  DRAFT: [EventStatus.PUBLISHED, EventStatus.CANCELLED],
  PUBLISHED: [EventStatus.COMPLETED, EventStatus.CANCELLED],
  COMPLETED: [],
  CANCELLED: [],
};

@Injectable()
export class EventService {
    constructor(private repo: EventsRepository, private cache: EventsCache) {}

    async create(dto: CreateEventDto, organizerId: number) {
        this.assertDates(dto.startTime, dto.endTime);
        if (new Date(dto.startTime) <= new Date()) {
            throw new BadRequestException('Start time must be in the future');
        }

        // Validate ticketTypes total quantity matches event totalQuantity
        if (dto.ticketTypes && dto.ticketTypes.length > 0) {
            const totalTicketQuantity = dto.ticketTypes.reduce((sum, t) => sum + t.quantity, 0);
            if (totalTicketQuantity !== dto.totalQuantity) {
                throw new BadRequestException('Sum of ticket type quantities must equal totalQuantity');
            }
        }

        const ticketTypesData = dto.ticketTypes?.map(t => ({
            name: t.name,
            price: new Prisma.Decimal(t.price),
            quantity: t.quantity,
        })) || [];

        return this.repo.create({
            ...dto,
            organizerId,
            ticketPrice: new Prisma.Decimal(dto.ticketPrice),
            ticketTypes: ticketTypesData.length > 0 ? { create: ticketTypesData } : undefined,
        } as any);
    }

    async update(id: number, dto: UpdateEventDto, userId: number) {
        const event = await this.getOwned(id, userId);
        if (event.status !== EventStatus.DRAFT && event.status !== EventStatus.PUBLISHED) {
            throw new BadRequestException(`A ${event.status} event cannot be updated`);
        }
        this.assertDates(dto.startTime ?? event.startTime, dto.endTime ?? event.endTime);

        // Extract ticketTypes from dto to handle separately if needed
        const { ticketTypes, ...updateData } = dto as any;
        
        // Convert price fields to Decimal if present
        if (updateData.ticketPrice !== undefined) {
            updateData.ticketPrice = new Prisma.Decimal(updateData.ticketPrice);
        }

        const updated = await this.repo.update(id, updateData);
        await this.cache.invalidate(id);
        return updated;
    }

    publish(id: number, userId: number) {
        return this.changeStatus(id, userId, EventStatus.PUBLISHED, (e) => {
            if (new Date(e.startTime) <= new Date()) {
                throw new BadRequestException('Cannot publish an event that has already started');
            }
        });
    }

    complete(id: number, userId: number) {
        return this.changeStatus(id, userId, EventStatus.COMPLETED, (e) => {
            if (new Date(e.endTime) > new Date()) {
                throw new BadRequestException('Event has not ended yet');
            }
        });
    }

    cancel(id: number, userId: number) {
        return this.changeStatus(id, userId, EventStatus.CANCELLED);
    }

    async findPublic(q: PublicEventDto) {
        if (q.minPrice !== undefined && q.maxPrice !== undefined && q.minPrice > q.maxPrice) {
            throw new BadRequestException('minimum price cannot be greater than maximum price');
        }
        if (q.startFrom && q.startTo && new Date(q.startFrom) > new Date(q.startTo)) {
            throw new BadRequestException('start time cannot be after the end time');
        }

        const key = await this.cache.listKey(q);
        const cached = await this.cache.getList(key);
        if (cached) return cached;

        const { items, total, page, limit } = await this.repo.listPublic(q);
        const response = buildPaginatedResponse(items, total, page, limit);
        await this.cache.setList(key, response);
        return response;
    }

    async findMe(userId: number, q: PaginationQueryDto) {
        const { items, total, page, limit } = await this.repo.listByOrganizer(userId, q);
        return buildPaginatedResponse(items, total, page, limit);
    }

    async findOnePublic(id: number) {
        let event = await this.cache.getOne(id);
        if (!event) {
            event = await this.repo.findById(id);
            if (event) await this.cache.setOne(id, event);
        }
        const visible = event && event.status !== EventStatus.DRAFT;
        if (!visible) throw new BadRequestException('Event not found');
        return event;
    }

    // TicketType methods
    async createTicketType(eventId: number, dto: TicketTypeDto, organizerId: number) {
        const event = await this.getOwned(eventId, organizerId);
        
        if (event.status !== EventStatus.DRAFT && event.status !== EventStatus.PUBLISHED) {
            throw new BadRequestException('Cannot add ticket types to completed/cancelled event');
        }

        // Check if total quantity would exceed event's totalQuantity
        const existingTypes = await this.repo.findTicketTypesByEvent(eventId);
        const currentTotal = existingTypes.reduce((sum, t) => sum + t.quantity, 0);
        if (currentTotal + dto.quantity > event.totalQuantity) {
            throw new BadRequestException(`Total ticket types quantity would exceed event totalQuantity (${event.totalQuantity})`);
        }

        const ticketType = await this.repo.createTicketType({
            name: dto.name,
            price: new Prisma.Decimal(dto.price),
            quantity: dto.quantity,
            eventId,
        });

        await this.cache.invalidate(eventId);
        return TicketTypeResponseDto.fromEntity(ticketType);
    }

    async getTicketTypes(eventId: number, organizerId: number) {
        await this.getOwned(eventId, organizerId);
        const ticketTypes = await this.repo.findTicketTypesByEvent(eventId);
        return ticketTypes.map(t => TicketTypeResponseDto.fromEntity(t));
    }

    async updateTicketType(id: number, dto: Partial<TicketTypeDto>, organizerId: number) {
        const ticketType = await this.repo.findTicketTypeById(id);
        if (!ticketType) throw new NotFoundException('Ticket type not found');
        
        await this.getOwned(ticketType.eventId, organizerId);

        if (dto.quantity !== undefined && dto.quantity < ticketType.sold) {
            throw new BadRequestException(`Cannot set quantity below sold tickets (${ticketType.sold})`);
        }

        // Check total quantity constraint
        if (dto.quantity !== undefined) {
            const existingTypes = await this.repo.findTicketTypesByEvent(ticketType.eventId);
            const currentTotal = existingTypes.filter(t => t.id !== id).reduce((sum, t) => sum + t.quantity, 0);
            const event = await this.repo.findById(ticketType.eventId);
            if (!event) throw new NotFoundException('Event not found');
            if (currentTotal + dto.quantity > event.totalQuantity) {
                throw new BadRequestException(`Total ticket types quantity would exceed event totalQuantity (${event.totalQuantity})`);
            }
        }

        const data: any = { ...dto };
        if (dto.price !== undefined) data.price = new Prisma.Decimal(dto.price);

        const updated = await this.repo.updateTicketType(id, data);
        await this.cache.invalidate(ticketType.eventId);
        return TicketTypeResponseDto.fromEntity(updated);
    }

    async deleteTicketType(id: number, organizerId: number) {
        const ticketType = await this.repo.findTicketTypeById(id);
        if (!ticketType) throw new NotFoundException('Ticket type not found');
        
        await this.getOwned(ticketType.eventId, organizerId);

        if (ticketType.sold > 0) {
            throw new BadRequestException('Cannot delete ticket type with sold tickets');
        }

        await this.repo.deleteTicketType(id);
        await this.cache.invalidate(ticketType.eventId);
        return { message: 'Ticket type deleted' };
    }

    private async changeStatus(id: number, userId: number, next: EventStatus, extra?: (event: { startTime: string | Date; endTime: string | Date }) => void) {
        const event = await this.getOwned(id, userId);
        if (!TRANSITIONS[event.status].includes(next)) {
            throw new BadRequestException(`Cannot change status from ${event.status} to ${next}`);
        }
        extra?.(event);
        const updated = await this.repo.setStatus(id, next);
        await this.cache.invalidate(id);
        return updated;
    }

    private async getOwned(id: number, userId: number) {
        const event = await this.repo.findById(id);
        if (!event) throw new BadRequestException('Event not found');
        if (event.organizerId !== userId) throw new ForbiddenException('You do not have permission to modify this event');
        return event;
    }

    private assertDates(start: string | Date, end: string | Date) {
        if (new Date(end) <= new Date(start)) throw new BadRequestException('End time must be after start time');
    }
}