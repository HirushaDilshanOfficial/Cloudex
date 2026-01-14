import { Controller, Get, Post, Body, Param, UseGuards, Query, Request, Patch, Delete } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@Controller('inventory')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InventoryController {
    constructor(private readonly inventoryService: InventoryService) { }

    @Post('ingredients')
    @Roles(UserRole.MANAGER, UserRole.ADMIN)
    createIngredient(@Body() data: any, @Request() req) {
        if (req.user.role !== UserRole.ADMIN) {
            data.branchId = req.user?.branchId;
        }
        return this.inventoryService.createIngredient(data);
    }

    @Get('ingredients')
    @Roles(UserRole.MANAGER, UserRole.ADMIN, UserRole.KITCHEN)
    findAll(@Query('tenantId') tenantId: string, @Request() req) {
        return this.inventoryService.findAll(tenantId, req.user?.branchId);
    }

    @Post('stock')
    @Roles(UserRole.MANAGER, UserRole.ADMIN)
    adjustStock(@Body() body: any, @Request() req) {
        return this.inventoryService.adjustStock(
            body.ingredientId,
            body.quantity,
            body.type,
            body.reason,
            body.tenantId,
            req.user?.branchId,
        );
    }

    @Post('ingredients/:id') // Using POST for update to avoid CORS/method issues if any, but standard is PATCH. Let's use PATCH.
    @Roles(UserRole.MANAGER, UserRole.ADMIN)
    updateIngredientPost(@Param('id') id: string, @Body() data: any) {
        return this.inventoryService.update(id, data);
    }

    @Patch('ingredients/:id')
    @Roles(UserRole.MANAGER, UserRole.ADMIN)
    updateIngredient(@Param('id') id: string, @Body() data: any) {
        return this.inventoryService.update(id, data);
    }

    @Delete('ingredients/:id')
    @Roles(UserRole.MANAGER, UserRole.ADMIN)
    removeIngredient(@Param('id') id: string) {
        return this.inventoryService.remove(id);
    }

    @Post('alerts')
    @Roles(UserRole.KITCHEN, UserRole.MANAGER, UserRole.ADMIN)
    createAlert(@Body() data: any, @Request() req) {
        data.branchId = req.user?.branchId;
        return this.inventoryService.createAlert(data);
    }

    @Get('alerts')
    @Roles(UserRole.MANAGER, UserRole.ADMIN)
    getAlerts(@Query('tenantId') tenantId: string, @Request() req) {
        return this.inventoryService.getAlerts(tenantId, req.user?.branchId);
    }

    @Patch('alerts/:id/resolve')
    @Roles(UserRole.MANAGER, UserRole.ADMIN)
    resolveAlert(@Param('id') id: string) {
        return this.inventoryService.resolveAlert(id);
    }
}
