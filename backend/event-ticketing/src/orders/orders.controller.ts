import { Controller, Post, Get, Param, Body, Query, Req, ParseIntPipe } from '@nestjs/common';
import { OrdersService } from './orders.service.js';
import { CreateOrderDto } from './dto/create-order.dto.js';
import { PayOrderDto } from './dto/pay-order.dto.js';
import { PaginationQueryDto } from '../common/pagination/pagination-query.dto.js';
import { Role } from '../common/decorator/roles.decorator.js';
import { Roles } from '../roles/roles.enum.js';
import type { AuthenicatedRequest } from '../common/types/authenticate-request.js';

@Controller('orders')
export class OrdersController {
  constructor(private orders: OrdersService) {}

  @Role(Roles.Customer)
  @Post()
  create(@Body() dto: CreateOrderDto, @Req() req: AuthenicatedRequest) {
    return this.orders.create(dto, req.user.sub);
  }

  @Role(Roles.Customer)
  @Get()
  findMine(@Query() q: PaginationQueryDto, @Req() req: AuthenicatedRequest) {
    return this.orders.findMine(req.user.sub, q);
  }

  @Role(Roles.Organizer)
  @Get('organizer')
  findOrganizerOrders(@Query() q: PaginationQueryDto, @Req() req: AuthenicatedRequest) {
    return this.orders.findOrganizerOrders(req.user.sub, q);
  }

  @Role(Roles.Customer)
  @Post(':id/pay')
  pay(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: PayOrderDto,
    @Req() req: AuthenicatedRequest
  ) {
    return this.orders.pay(id, req.user.sub, dto);
  }

  @Role(Roles.Customer)
  @Post(':id/cancel')
  cancel(@Param('id', ParseIntPipe) id: number, @Req() req: AuthenicatedRequest) {
    return this.orders.cancel(id, req.user.sub);
  }

  @Role(Roles.Admin, Roles.Organizer)
  @Post('cleanup-stale')
  cleanupStale() {
    return this.orders.cleanupStalePendingOrders();
  }
}