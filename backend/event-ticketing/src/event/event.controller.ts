import { Body, Controller, Get, Param, ParseIntPipe, Post, Query, Req, Patch, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { EventService } from './event.service.js';
import { Public } from '../common/decorator/public.decorator.js';
import { PublicEventDto } from './dto/public-event.dto.js';
import { PaginationQueryDto } from '../common/pagination/pagination-query.dto.js';
import { Role } from '../common/decorator/roles.decorator.js';
import type { AuthenicatedRequest } from '../common/types/authenticate-request.js';
import { CreateEventDto, TicketTypeDto } from './dto/create.event.dto.js';
import { UpdateEventDto } from './dto/update-event.dto.js';
import { Roles } from '../roles/roles.enum.js';

@ApiTags('Events')
@Controller('event')
export class EventController {
  constructor(private events: EventService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List published upcoming events (paginated, searchable, filterable)' })
  @ApiResponse({ status: 200, description: 'Paginated list of events', example: { data: [{ id: 1, title: 'Tech Conference', description: 'Annual tech conference', venue: 'Convention Center', startTime: '2026-12-15T09:00:00Z', endTime: '2026-12-15T18:00:00Z', ticketPrice: 1000, totalQuantity: 100, maxPerOrder: 5, status: 'PUBLISHED' }], meta: { total: 10, page: 1, limit: 10, totalPages: 1, hasNextPage: false, hasPrevPage: false } } })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiQuery({ name: 'search', required: false, example: 'tech' })
  @ApiQuery({ name: 'startFrom', required: false, example: '2026-12-01T00:00:00Z' })
  @ApiQuery({ name: 'startTo', required: false, example: '2026-12-31T23:59:59Z' })
  @ApiQuery({ name: 'minPrice', required: false, example: 500 })
  @ApiQuery({ name: 'maxPrice', required: false, example: 5000 })
  findPublic(@Query() q: PublicEventDto) {
    return this.events.findPublic(q);
  }

  @Role(Roles.Organizer)
  @Get('me')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'List organizer\'s own events' })
  @ApiResponse({ status: 200, description: 'Paginated list of organizer events' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  findMe(@Query() q: PaginationQueryDto, @Req() req: AuthenicatedRequest) {
    return this.events.findMe(req.user.sub, q);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get event details by ID' })
  @ApiResponse({ status: 200, description: 'Event details', example: { id: 1, title: 'Tech Conference', description: 'Annual tech conference', venue: 'Convention Center', startTime: '2026-12-15T09:00:00Z', endTime: '2026-12-15T18:00:00Z', ticketPrice: 1000, totalQuantity: 100, maxPerOrder: 5, status: 'PUBLISHED', ticketTypes: [{ id: 1, name: 'VIP', price: 5000, quantity: 20, sold: 5, available: 15 }] } })
  @ApiResponse({ status: 404, description: 'Event not found' })
  @ApiParam({ name: 'id', example: 1 })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.events.findOnePublic(id);
  }

  @Role(Roles.Organizer)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create a new event (organizer only)' })
  @ApiResponse({ status: 201, description: 'Event created', example: { id: 1, title: 'Tech Conference', description: 'Annual tech conference', venue: 'Convention Center', startTime: '2026-12-15T09:00:00Z', endTime: '2026-12-15T18:00:00Z', ticketPrice: 1000, totalQuantity: 100, maxPerOrder: 5, status: 'DRAFT' } })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  create(@Body() dto: CreateEventDto, @Req() req: AuthenicatedRequest) {
    return this.events.create(dto, req.user.sub);
  }

  @Role(Roles.Organizer)
  @Patch(':id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update an event (organizer only, DRAFT/PUBLISHED only)' })
  @ApiResponse({ status: 200, description: 'Event updated' })
  @ApiResponse({ status: 400, description: 'Cannot update completed/cancelled event' })
  @ApiResponse({ status: 403, description: 'Not your event' })
  @ApiParam({ name: 'id', example: 1 })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateEventDto, @Req() req: AuthenicatedRequest) {
    return this.events.update(id, dto, req.user.sub);
  }

  @Role(Roles.Organizer)
  @Patch(':id/publish')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Publish an event (DRAFT → PUBLISHED)' })
  @ApiResponse({ status: 200, description: 'Event published' })
  @ApiResponse({ status: 400, description: 'Cannot publish past event' })
  @ApiParam({ name: 'id', example: 1 })
  publish(@Param('id', ParseIntPipe) id: number, @Req() req: AuthenicatedRequest) {
    return this.events.publish(id, req.user.sub);
  }

  @Role(Roles.Organizer)
  @Patch(':id/cancel')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Cancel an event and cascade cancel all orders' })
  @ApiResponse({ status: 200, description: 'Event cancelled with orders refunded', example: { id: 1, title: 'Tech Conference', status: 'CANCELLED', cancellationSummary: { ordersCancelled: 15, totalRefunded: 45000 } } })
  @ApiResponse({ status: 400, description: 'Event already cancelled' })
  @ApiParam({ name: 'id', example: 1 })
  cancel(@Param('id', ParseIntPipe) id: number, @Req() req: AuthenicatedRequest) {
    return this.events.cancel(id, req.user.sub);
  }

  @Role(Roles.Organizer)
  @Patch(':id/complete')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Mark event as completed (PUBLISHED → COMPLETED)' })
  @ApiResponse({ status: 200, description: 'Event completed' })
  @ApiResponse({ status: 400, description: 'Event has not ended yet' })
  @ApiParam({ name: 'id', example: 1 })
  complete(@Param('id', ParseIntPipe) id: number, @Req() req: AuthenicatedRequest) {
    return this.events.complete(id, req.user.sub);
  }

  // TicketType endpoints
  @Role(Roles.Organizer)
  @Post(':eventId/ticket-types')
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Add ticket type to event' })
  @ApiResponse({ status: 201, description: 'Ticket type created', example: { id: 1, name: 'VIP', price: 5000, quantity: 20, sold: 0, available: 20, eventId: 1 } })
  @ApiResponse({ status: 400, description: 'Quantity exceeds event totalQuantity' })
  @ApiParam({ name: 'eventId', example: 1 })
  createTicketType(
    @Param('eventId', ParseIntPipe) eventId: number,
    @Body() dto: TicketTypeDto,
    @Req() req: AuthenicatedRequest
  ) {
    return this.events.createTicketType(eventId, dto, req.user.sub);
  }

  @Role(Roles.Organizer)
  @Get(':eventId/ticket-types')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'List ticket types for an event' })
  @ApiResponse({ status: 200, description: 'List of ticket types', example: [{ id: 1, name: 'VIP', price: 5000, quantity: 20, sold: 5, available: 15, eventId: 1 }, { id: 2, name: 'Regular', price: 1000, quantity: 80, sold: 20, available: 60, eventId: 1 }] })
  @ApiParam({ name: 'eventId', example: 1 })
  getTicketTypes(
    @Param('eventId', ParseIntPipe) eventId: number,
    @Req() req: AuthenicatedRequest
  ) {
    return this.events.getTicketTypes(eventId, req.user.sub);
  }

  @Role(Roles.Organizer)
  @Patch('ticket-types/:id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update ticket type' })
  @ApiResponse({ status: 200, description: 'Ticket type updated' })
  @ApiResponse({ status: 400, description: 'Cannot set quantity below sold tickets' })
  @ApiParam({ name: 'id', example: 1 })
  updateTicketType(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: Partial<TicketTypeDto>,
    @Req() req: AuthenicatedRequest
  ) {
    return this.events.updateTicketType(id, dto, req.user.sub);
  }

  @Role(Roles.Organizer)
  @Delete('ticket-types/:id')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete ticket type (only if no tickets sold)' })
  @ApiResponse({ status: 200, description: 'Ticket type deleted', example: { message: 'Ticket type deleted' } })
  @ApiResponse({ status: 400, description: 'Cannot delete ticket type with sold tickets' })
  @ApiParam({ name: 'id', example: 1 })
  deleteTicketType(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenicatedRequest
  ) {
    return this.events.deleteTicketType(id, req.user.sub);
  }
}