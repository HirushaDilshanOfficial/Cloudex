import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AnalyticsController {
    constructor(private readonly analyticsService: AnalyticsService) { }

    @Get('sales/daily')
    @Roles(UserRole.ADMIN, UserRole.MANAGER)
    getDailySales(@Query('tenantId') tenantId: string) {
        return this.analyticsService.getDailySales(tenantId);
    }

    @Get('sales/weekly')
    @Roles(UserRole.ADMIN, UserRole.MANAGER)
    getWeeklySales(@Query('tenantId') tenantId: string) {
        return this.analyticsService.getWeeklySales(tenantId);
    }

    @Get('sales/monthly')
    @Roles(UserRole.ADMIN, UserRole.MANAGER)
    getMonthlySales(@Query('tenantId') tenantId: string) {
        return this.analyticsService.getMonthlySales(tenantId);
    }

    @Get('sales/trend')
    @Roles(UserRole.ADMIN, UserRole.MANAGER)
    getSalesTrend(@Query('tenantId') tenantId: string, @Query('days') days: number) {
        return this.analyticsService.getSalesTrend(tenantId, days);
    }

    @Get('products/top')
    @Roles(UserRole.ADMIN, UserRole.MANAGER)
    getTopSellingProducts(@Query('tenantId') tenantId: string) {
        return this.analyticsService.getTopSellingProducts(tenantId);
    }

    @Get('orders/recent')
    @Roles(UserRole.ADMIN, UserRole.MANAGER)
    getRecentOrders(@Query('tenantId') tenantId: string) {
        return this.analyticsService.getRecentOrders(tenantId);
    }
}
