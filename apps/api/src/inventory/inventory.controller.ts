import { Controller, Get, Post, Body, Param, UseGuards, Query } from '@nestjs/common';
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
    createIngredient(@Body() data: any) {
        return this.inventoryService.createIngredient(data);
    }

    @Get('ingredients')
    findAll(@Query('tenantId') tenantId: string) {
        return this.inventoryService.findAll(tenantId);
    }

    @Post('stock')
    @Roles(UserRole.MANAGER, UserRole.ADMIN)
    adjustStock(@Body() body: any) {
        return this.inventoryService.adjustStock(
            body.ingredientId,
            body.quantity,
            body.type,
            body.reason,
            body.tenantId,
        );
    }
}
