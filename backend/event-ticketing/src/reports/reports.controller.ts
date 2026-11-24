import { Controller, Get, Param, Query, Req, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { ReportsService } from './reports.service.js';
import { Role } from '../common/decorator/roles.decorator.js';
import { Roles } from '../roles/roles.enum.js';
import type { AuthenicatedRequest } from '../common/types/authenticate-request.js';

@ApiTags('Reports')
@Controller('reports')
export class ReportsController {
  constructor(private reports: ReportsService) {}

  @Role(Roles.Organizer)
  @Get('organizer')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get sales reports for all organizer events' })
  @ApiResponse({ status: 200, description: 'Organizer reports with summary and per-event details', example: { summary: { totalEvents: 5, publishedEvents: 3, totalTicketsSold: 245, totalRevenue: 125000, totalCheckIns: 180 }, events: [{ eventId: 1, title: 'Tech Conference', status: 'PUBLISHED', totalTicketsSold: 120, totalRevenue: 60000, ticketsByType: [{ ticketTypeId: 1, name: 'VIP', ticketsSold: 20, revenue: 100000 }], checkIns: { total: 150, checkedIn: 95, pending: 55 } }] } })
  async getOrganizerReports(@Req() req: AuthenicatedRequest) {
    return this.reports.getOrganizerReports(req.user.sub);
  }

  @Role(Roles.Organizer)
  @Get('event/:eventId')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get detailed report for a specific event' })
  @ApiResponse({ status: 200, description: 'Event report', example: { eventId: 1, totalTicketsSold: 120, totalRevenue: 60000, ticketsByType: [{ ticketTypeId: 1, name: 'VIP', ticketsSold: 20, revenue: 100000 }], checkIns: { total: 150, checkedIn: 95, pending: 55 } } })
  @ApiResponse({ status: 403, description: 'Not your event' })
  @ApiParam({ name: 'eventId', example: 1 })
  async getEventReport(
    @Param('eventId', ParseIntPipe) eventId: number,
    @Req() req: AuthenicatedRequest
  ) {
    return this.reports.getEventReport(eventId, req.user.sub);
  }

  @Role(Roles.Organizer)
  @Get('event/:eventId/revenue')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get daily revenue breakdown for an event within date range' })
  @ApiResponse({ status: 200, description: 'Daily revenue breakdown', example: { eventId: 1, dateRange: { start: '2026-11-01T00:00:00Z', end: '2026-11-30T23:59:59Z' }, dailyRevenue: [{ date: '2026-11-15', revenue: 5000, ticketsSold: 10 }], totalRevenue: 17000, totalTicketsSold: 34 } })
  @ApiResponse({ status: 403, description: 'Not your event' })
  @ApiParam({ name: 'eventId', example: 1 })
  @ApiQuery({ name: 'startDate', required: true, example: '2026-11-01', description: 'Start date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: true, example: '2026-11-30', description: 'End date (YYYY-MM-DD)' })
  async getEventRevenueByDateRange(
    @Param('eventId', ParseIntPipe) eventId: number,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Req() req: AuthenicatedRequest
  ) {
    return this.reports.getEventRevenueByDateRange(
      eventId,
      req.user.sub,
      new Date(startDate),
      new Date(endDate)
    );
  }
}