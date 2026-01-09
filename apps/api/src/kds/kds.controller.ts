import { Controller, Get, Post, Body, Param, UseGuards, Query, Put } from '@nestjs/common';
import { KdsService } from './kds.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@Controller('kds')
@UseGuards(JwtAuthGuard, RolesGuard)
export class KdsController {
    constructor(private readonly kdsService: KdsService) { }

    @Get('active')
    @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER, UserRole.KITCHEN)
    getActiveOrders(@Query('tenantId') tenantId: string) {
        return this.kdsService.getActiveOrders(tenantId);
    }

    @Put('orders/:id/status')
    @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER, UserRole.KITCHEN)
    updateStatus(
        @Param('id') id: string,
        @Body('status') status: any,
        @Body('tenantId') tenantId: string,
        @Body('reason') reason?: string
    ) {
        return this.kdsService.updateOrderStatus(id, status, tenantId, reason);
    }
}
