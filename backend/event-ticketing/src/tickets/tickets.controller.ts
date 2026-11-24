import { Controller, Get, Post, Param, Req, Query, ParseIntPipe, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { TicketsService } from './tickets.service.js';
import { PaginationQueryDto } from '../common/pagination/pagination-query.dto.js';
import { Role } from '../common/decorator/roles.decorator.js';
import { Roles } from '../roles/roles.enum.js';
import type { AuthenicatedRequest } from '../common/types/authenticate-request.js';

@ApiTags('Tickets')
@Controller('tickets')
export class TicketsController {
  constructor(private tickets: TicketsService) {}

  @Role(Roles.Organizer)
  @Post(':code/checkin')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Check in a ticket by code (organizer only, own events)' })
  @ApiResponse({ status: 200, description: 'Ticket checked in', example: { id: 1, code: 'TKT-ABC123DEF4', checkedIn: true, checkedInAt: '2026-11-24T10:30:00Z', checkedInBy: 1, event: { id: 1, title: 'Tech Conference' }, ticketType: { id: 1, name: 'VIP' } } })
  @ApiResponse({ status: 400, description: 'Ticket already checked in, event cancelled, or order cancelled' })
  @ApiResponse({ status: 403, description: 'Not your event' })
  @ApiResponse({ status: 404, description: 'Ticket not found' })
  @ApiParam({ name: 'code', example: 'TKT-ABC123DEF4' })
  checkIn(
    @Param('code') code: string,
    @Req() req: AuthenicatedRequest
  ) {
    return this.tickets.checkIn(code, req.user.sub);
  }

  @Role(Roles.Customer)
  @Get()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'List customer\'s own tickets' })
  @ApiResponse({ status: 200, description: 'Paginated list of tickets', example: { data: [{ id: 1, code: 'TKT-ABC123DEF4', checkedIn: false, orderId: 1, event: { id: 1, title: 'Tech Conference' }, ticketType: { id: 1, name: 'VIP' } }], meta: { total: 5, page: 1, limit: 10, totalPages: 1, hasNextPage: false, hasPrevPage: false } } })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  getMyTickets(
    @Query() q: PaginationQueryDto,
    @Req() req: AuthenicatedRequest
  ) {
    return this.tickets.getMyTickets(req.user.sub);
  }

  @Role(Roles.Organizer)
  @Get('event/:eventId')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'List all tickets for an event (organizer only)' })
  @ApiResponse({ status: 200, description: 'List of tickets for event', example: [{ id: 1, code: 'TKT-ABC123DEF4', checkedIn: true, checkedInAt: '2026-11-24T10:30:00Z', customer: { id: 1, username: 'john' }, orderId: 1, ticketType: { id: 1, name: 'VIP' } }] })
  @ApiParam({ name: 'eventId', example: 1 })
  getEventTickets(
    @Param('eventId', ParseIntPipe) eventId: number,
    @Req() req: AuthenicatedRequest
  ) {
    return this.tickets.getEventTickets(eventId, req.user.sub);
  }

  @Role(Roles.Organizer)
  @Get('event/:eventId/checkin-stats')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get check-in statistics for an event' })
  @ApiResponse({ status: 200, description: 'Check-in stats', example: { total: 100, checkedIn: 65, pending: 35 } })
  @ApiParam({ name: 'eventId', example: 1 })
  getCheckInStats(
    @Param('eventId', ParseIntPipe) eventId: number,
    @Req() req: AuthenicatedRequest
  ) {
    return this.tickets.getCheckInStats(eventId, req.user.sub);
  }

  @Role(Roles.Customer, Roles.Organizer)
  @Get(':code')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get ticket details by code' })
  @ApiResponse({ status: 200, description: 'Ticket details', example: { id: 1, code: 'TKT-ABC123DEF4', checkedIn: false, orderId: 1, event: { id: 1, title: 'Tech Conference' }, ticketType: { id: 1, name: 'VIP', price: 5000 }, customer: { id: 1, username: 'john' } } })
  @ApiResponse({ status: 404, description: 'Ticket not found' })
  @ApiParam({ name: 'code', example: 'TKT-ABC123DEF4' })
  getTicketByCode(
    @Param('code') code: string,
    @Req() req: AuthenicatedRequest
  ) {
    return this.tickets.getTicketByCode(code);
  }
}