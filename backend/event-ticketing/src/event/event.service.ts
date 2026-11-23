import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { Prisma, EventStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/client';
import { EventsRepository } from './event.repository.js';
import { EventsCache } from './events-cache.js';
import { CreateEventDto } from './dto/create.event.dto.js';
import { UpdateEventDto } from './dto/update-event.dto.js';
import { PublicEventDto } from './dto/public-event.dto.js';
import { PaginationQueryDto } from '../common/pagination/pagination-query.dto.js';
import { buildPaginatedResponse } from '../common/pagination/paginate.js';

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
      if (dto.startTime <=  new Date()) {
        throw new BadRequestException('Start time must be in the future');
      }
      return this.repo.create({...dto, organizerId})
    }

    async update(id: number, dto: UpdateEventDto, userId: number) {
        const event = await this.getOwned(id, userId);
        if (event.status !== EventStatus.DRAFT && event.status !== EventStatus.PUBLISHED){
            throw new BadRequestException(`A ${event.status} event cannot be updated`);
        }
        this.assertDates(dto.startTime ?? event.startTime, dto.endTime ?? event.endTime);

        const updated = await this.repo.update(id, dto);
        await this.cache.invalidate(id);
        return updated;
    }

    publish(id: number, userId: number) {
        return this.changeStatus(id, userId, EventStatus.PUBLISHED, (e) => {
            if (e.startTime <= new Date()) {
                throw new BadRequestException('Cannot publish an event that has already started');
            }
        });
    }

    complete(id: number, userId: number){
        return this.changeStatus(id, userId, EventStatus.COMPLETED, (e) => {
            if (e.startTime > new Date()) {
                throw new BadRequestException('Event has not ended yet');
            }
        });
    }

    cancel(id: number, userId: number){
        return this.changeStatus(id, userId, EventStatus.CANCELLED);
    }

    async findPublic(q: PublicEventDto){
        if (q.minPrice !== undefined && q.maxPrice !== undefined && q.minPrice > q.maxPrice){
            throw new BadRequestException('minimum price cannot be greater than maximum price');
        }
        if (q.startFrom && q.startTo && q.startFrom > q.startTo){
            throw new BadRequestException('start time cannot be after the end time');
        }

        const key = await this.cache.listKey(q);
        const cached = await this.cache.getList(key);
        if (cached) return cached;

        const { items, total } = await this.repo.listPublic(q);
        const response = buildPaginatedResponse(items, total, q.page, q.limit);
        await this.cache.setList(key, response);
        return response;

    }

    async findMe(userId: number, q: PaginationQueryDto){
        const { items, total} = await this.repo.listByOrganizer(userId, q);
        return buildPaginatedResponse(items, total, q.page, q.limit);
    }

    async findOnePublic(id: number){
        let event = await this.cache.getOne(id);
        if (!event){
            event = await this.repo.findById(id);
            if (event) await this.cache.setOne(id, event);
        }
        const visible = event && event.status !==EventStatus.DRAFT;
        if(!visible) throw new BadRequestException('Event not found');
        return event;
    }

    private async changeStatus( id: number, userId: number, next: EventStatus, extra?: (event: {startTime: Date; endTime: Date}) => void,){
        const event = await this.getOwned(id, userId);
        if (!TRANSITIONS[event.status].includes(next)){
            throw new BadRequestException(`Cannot change status from ${event.status} to ${next}`);
        }
        extra?.(event);
        const updated = await this.repo.setStatus(id, next);
        await this.cache.invalidate(id);
        return updated;
    }

    private async getOwned(id: number, userId: number){
        const event = await this.repo.findById(id);
        if(!event) throw new BadRequestException('Event not found');
        if (event.organizerId !== userId) throw new ForbiddenException('You do not have permission to modify this event');
        return event;
    }

    private assertDates(start: Date, end: Date){
        if (end <= start) throw new BadRequestException('End time must be after start time');
    }
}


