import { Controller, Get, Query, Patch, Param, Body, Delete, ParseIntPipe, HttpCode, HttpStatus, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { AdminService, DashboardFilters } from './admin.service.js';
import { Role } from '../common/decorator/roles.decorator.js';
import { Roles } from '../roles/roles.enum.js';
import type { AuthenicatedRequest } from '../common/types/authenticate-request.js';
import { UpdateUserRoleDto } from './dto/update-user-role.dto.js';

@ApiTags('Admin Dashboard')
@Controller('admin')
export class AdminController {
  constructor(private admin: AdminService) {}

  @Role(Roles.Admin)
  @Get('dashboard')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get admin dashboard with platform totals' })
  @ApiResponse({ 
    status: 200, 
    description: 'Platform dashboard with all metrics',
    example: {
      totalTicketsSold: 1250,
      totalRevenue: 6250000,
      paymentsByStatus: {
        SUCCESSFUL: { count: 450, totalAmount: 6250000 },
        FAILED: { count: 50, totalAmount: 0 },
        REFUNDED: { count: 25, totalAmount: 125000 }
      },
      totalOrders: 500,
      cancelledOrders: 30,
      eventsByStatus: { DRAFT: 10, PUBLISHED: 25, COMPLETED: 15, CANCELLED: 5 },
      totalOrganizers: 12,
      totalCustomers: 1250,
      topEvents: [
        { eventId: 1, title: 'Tech Conference', organizer: { id: 1, username: 'org1' }, revenue: 100000, ticketsSold: 200 }
      ],
      topOrganizers: [
        { organizerId: 1, username: 'org1', email: 'org1@test.com', revenue: 500000, ticketsSold: 1000 }
      ],
      filters: { startDate: '2026-01-01T00:00:00Z', endDate: '2026-12-31T23:59:59Z', organizerId: undefined }
    }
  })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date (ISO 8601)', example: '2026-01-01T00:00:00Z' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date (ISO 8601)', example: '2026-12-31T23:59:59Z' })
  @ApiQuery({ name: 'organizerId', required: false, type: Number, description: 'Filter by organizer ID', example: 1 })
  async getDashboard(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('organizerId') organizerId?: string,
    @Req() req?: AuthenicatedRequest
  ) {
    const filters: DashboardFilters = {};
    if (startDate) filters.startDate = new Date(startDate);
    if (endDate) filters.endDate = new Date(endDate);
    if (organizerId) filters.organizerId = parseInt(organizerId, 10);
    return this.admin.getDashboard(filters);
  }

  // User Management
  @Role(Roles.Admin)
  @Get('users')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'List all users with pagination and filters' })
  @ApiResponse({ 
    status: 200, 
    description: 'Paginated list of users',
    example: {
      data: [
        { id: 1, username: 'john', email: 'john@example.com', phoneNumber: '9876543210', role: ['CUSTOMER'], createdAt: '2026-01-15T10:00:00Z', isActive: true },
        { id: 2, username: 'org1', email: 'org1@test.com', phoneNumber: '9876543211', role: ['ORGANIZER'], createdAt: '2026-01-10T10:00:00Z', isActive: true }
      ],
      meta: { total: 100, page: 1, limit: 10, totalPages: 10, hasNextPage: true, hasPrevPage: false }
    }
  })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiQuery({ name: 'role', required: false, enum: ['ADMIN', 'ORGANIZER', 'CUSTOMER'], description: 'Filter by role' })
  @ApiQuery({ name: 'search', required: false, example: 'john', description: 'Search by username or email' })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean, description: 'Filter by active status' })
  async getUsers(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('role') role?: string,
    @Query('search') search?: string,
    @Query('isActive') isActive?: string,
  ) {
    const pageNum = parseInt(page || '1', 10);
    const limitNum = parseInt(limit || '10', 10);
    const isActiveBool = isActive === 'true' ? true : isActive === 'false' ? false : undefined;
    return this.admin.getUsers({ page: pageNum, limit: limitNum, role, search, isActive: isActiveBool });
  }

  @Role(Roles.Admin)
  @Get('users/:id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, description: 'User details', example: { id: 1, username: 'john', email: 'john@example.com', phoneNumber: '9876543210', role: ['CUSTOMER'], createdAt: '2026-01-15T10:00:00Z', isActive: true, events: [], orders: [] } })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiParam({ name: 'id', example: 1 })
  async getUser(@Param('id', ParseIntPipe) id: number) {
    return this.admin.getUserById(id);
  }

  @Role(Roles.Admin)
  @Patch('users/:id/role')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update user role(s)' })
  @ApiResponse({ status: 200, description: 'User role updated', example: { id: 1, username: 'john', email: 'john@example.com', role: ['ORGANIZER'], updatedAt: '2026-11-24T10:00:00Z' } })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiParam({ name: 'id', example: 1 })
  async updateUserRole(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserRoleDto,
  ) {
    return this.admin.updateUserRole(id, dto.roles);
  }

  @Role(Roles.Admin)
  @Patch('users/:id/toggle-status')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Activate/deactivate user' })
  @ApiResponse({ status: 200, description: 'User status toggled', example: { id: 1, username: 'john', isActive: false } })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiParam({ name: 'id', example: 1 })
  async toggleUserStatus(@Param('id', ParseIntPipe) id: number) {
    return this.admin.toggleUserStatus(id);
  }

  @Role(Roles.Admin)
  @Delete('users/:id')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete user (soft delete - deactivates)' })
  @ApiResponse({ status: 200, description: 'User deactivated', example: { message: 'User deactivated successfully' } })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiParam({ name: 'id', example: 1 })
  async deleteUser(@Param('id', ParseIntPipe) id: number) {
    return this.admin.deleteUser(id);
  }
}