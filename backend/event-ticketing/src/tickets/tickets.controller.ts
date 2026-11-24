import { Controller, Get, Post, Param, Req, Query,ParseIntPipe } from '@nestjs/common';
import { TicketsService } from './tickets.service.js';
import { PaginationQueryDto } from '../common/pagination/pagination-query.dto.js';
import { Role } from '../common/decorator/roles.decorator.js';
import { Roles } from '../roles/roles.enum.js';
import type { AuthenicatedRequest } from '../common/types/authenticate-request.js';

@Controller('tickets')
export class TicketsController {
  constructor(private tickets: TicketsService) {}

  @Role(Roles.Organizer)
  @Post(':code/checkin')
  checkIn(
    @Param('code') code: string,
    @Req() req: AuthenicatedRequest
  ) {
    return this.tickets.checkIn(code, req.user.sub);
  }

  @Role(Roles.Customer)
  @Get()
  getMyTickets(
    @Query() q: PaginationQueryDto,
    @Req() req: AuthenicatedRequest
  ) {
    return this.tickets.getMyTickets(req.user.sub);
  }

  @Role(Roles.Organizer)
  @Get('event/:eventId')
  getEventTickets(
    @Param('eventId', ParseIntPipe) eventId: number,
    @Req() req: AuthenicatedRequest
  ) {
    return this.tickets.getEventTickets(eventId, req.user.sub);
  }

  @Role(Roles.Organizer)
  @Get('event/:eventId/checkin-stats')
  getCheckInStats(
    @Param('eventId', ParseIntPipe) eventId: number,
    @Req() req: AuthenicatedRequest
  ) {
    return this.tickets.getCheckInStats(eventId, req.user.sub);
  }

  @Role(Roles.Customer, Roles.Organizer)
  @Get(':code')
  getTicketByCode(
    @Param('code') code: string,
    @Req() req: AuthenicatedRequest
  ) {
    return this.tickets.getTicketByCode(code);
  }
}