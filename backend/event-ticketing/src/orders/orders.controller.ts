import { Controller, Post, Get, Param, Body, Query, Req, ParseIntPipe, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { OrdersService } from './orders.service.js';
import { CreateOrderDto } from './dto/create-order.dto.js';
import { PayOrderDto } from './dto/pay-order.dto.js';
import { PaginationQueryDto } from '../common/pagination/pagination-query.dto.js';
import { Role } from '../common/decorator/roles.decorator.js';
import { Roles } from '../roles/roles.enum.js';
import type { AuthenicatedRequest } from '../common/types/authenticate-request.js';

@ApiTags('Orders')
@Controller('orders')
export class OrdersController {
  constructor(private orders: OrdersService) {}

  @Role(Roles.Customer)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create a new order (holds tickets for 15 minutes)' })
  @ApiResponse({ status: 201, description: 'Order created with hold', example: { id: 1, orderNumber: 'abc-123', eventId: 1, ticketTypeId: 1, quantity: 2, unitPrice: 1000, totalAmount: 2000, status: 'PENDING', paymentStatus: 'FAILED', hold: { id: 1, expiresAt: '2026-11-24T10:45:00Z' } } })
  @ApiResponse({ status: 400, description: 'Not enough tickets or event not published' })
  @ApiResponse({ status: 404, description: 'Ticket type not found' })
  create(@Body() dto: CreateOrderDto, @Req() req: AuthenicatedRequest) {
    return this.orders.create(dto, Number(req.user.sub));
  }

  @Role(Roles.Customer)
  @Get()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'List customer\'s own orders' })
  @ApiResponse({ status: 200, description: 'Paginated list of orders', example: { data: [{ id: 1, orderNumber: 'abc-123', eventId: 1, ticketTypeId: 1, quantity: 2, unitPrice: 1000, totalAmount: 2000, status: 'PAID', paymentStatus: 'SUCCESSFUL', tickets: [{ id: 1, code: 'TKT-ABC123DEF4' }, { id: 2, code: 'TKT-GHI567JKL8' }] }], meta: { total: 5, page: 1, limit: 10, totalPages: 1, hasNextPage: false, hasPrevPage: false } } })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  findMine(@Query() q: PaginationQueryDto, @Req() req: AuthenicatedRequest) {
    return this.orders.findMine(Number(req.user.sub), q);
  }

  @Role(Roles.Organizer)
  @Get('organizer')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'List orders for organizer\'s events' })
  @ApiResponse({ status: 200, description: 'Paginated list of orders for organizer events' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  findOrganizerOrders(@Query() q: PaginationQueryDto, @Req() req: AuthenicatedRequest) {
    return this.orders.findOrganizerOrders(Number(req.user.sub), q);
  }

  @Role(Roles.Customer)
  @Post(':id/pay')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Pay for order (Mock Esewa payment)' })
  @ApiResponse({ status: 200, description: 'Payment successful, tickets issued', example: { order: { id: 1, status: 'PAID', paymentStatus: 'SUCCESSFUL' }, tickets: [{ id: 1, code: 'TKT-ABC123DEF4' }, { id: 2, code: 'TKT-GHI567JKL8' }], payment: { providerRef: 'ESEWA-1700000000-abc1', status: 'SUCCESSFUL' } } })
  @ApiResponse({ status: 400, description: 'Order not pending or payment window expired' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @ApiParam({ name: 'id', example: 1 })
  pay(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: PayOrderDto,
    @Req() req: AuthenicatedRequest
  ) {
    return this.orders.pay(id, Number(req.user.sub), dto);
  }

  @Role(Roles.Customer)
  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Cancel paid order (24 hours before event)' })
  @ApiResponse({ status: 200, description: 'Order cancelled, refund initiated', example: { message: 'Order cancelled, refund initiated' } })
  @ApiResponse({ status: 400, description: 'Only paid orders can be cancelled, or not within 24h window' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @ApiParam({ name: 'id', example: 1 })
  cancel(@Param('id', ParseIntPipe) id: number, @Req() req: AuthenicatedRequest) {
    return this.orders.cancel(id, Number(req.user.sub));
  }

  @Role(Roles.Admin, Roles.Organizer)
  @Post('cleanup-stale')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Manually trigger cleanup of stale pending orders' })
  @ApiResponse({ status: 200, description: 'Cleanup completed', example: { cleaned: 3 } })
  cleanupStale() {
    return this.orders.cleanupStalePendingOrders();
  }
}