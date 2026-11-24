import { Body, Controller, Get, Param, ParseIntPipe, Post, Query, Req, Patch } from '@nestjs/common';
import { EventService } from './event.service.js';
import { Public } from '../common/decorator/public.decorator.js';
import { PublicEventDto } from './dto/public-event.dto.js';
import { PaginationQueryDto } from '../common/pagination/pagination-query.dto.js';
import { Role } from '../common/decorator/roles.decorator.js';
import type { AuthenicatedRequest } from '../common/types/authenticate-request.js';
import { CreateEventDto } from './dto/create.event.dto.js';
import { UpdateEventDto } from './dto/update-event.dto.js';
import { Roles } from '../roles/roles.enum.js';

@Controller('event')
export class EventController {
    constructor(private events: EventService) {}

    @Public()
    @Get()
    findPublic(@Query() q: PublicEventDto) {
        return this.events.findPublic(q);
    }

    @Role(Roles.Organizer)
    @Get('me')
    findMe(@Query() q: PaginationQueryDto, @Req() req: AuthenicatedRequest) {
        return this.events.findMe(req.user.sub, q);
    }

    @Public()
    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.events.findOnePublic(id);
    }

    @Role(Roles.Organizer)
    @Post()
    create(@Body() dto: CreateEventDto, @Req() req: AuthenicatedRequest) {
        return this.events.create(dto, req.user.sub);
    }

    @Role(Roles.Organizer)
    @Patch(':id')
    update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateEventDto, @Req() req: AuthenicatedRequest) {
        return this.events.update(id, dto, req.user.sub);
    }

    @Role(Roles.Organizer)
    @Patch(':id/publish')
    publish(@Param('id', ParseIntPipe) id: number, @Req() req: AuthenicatedRequest) {
        return this.events.publish(id, req.user.sub);
    }

    @Role(Roles.Organizer)
    @Patch(':id/cancel')
    cancel(@Param('id', ParseIntPipe) id: number, @Req() req: AuthenicatedRequest) {
        return this.events.cancel(id, req.user.sub);
    }

     @Role(Roles.Organizer)
    @Patch(':id/cancel')
    complete(@Param('id', ParseIntPipe) id: number, @Req() req: AuthenicatedRequest) {
        return this.events.cancel(id, req.user.sub);
    }
}    


