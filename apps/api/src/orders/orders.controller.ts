import { Controller, Get, Post, Body, Param, UseGuards, Query } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrdersController {
    constructor(private readonly ordersService: OrdersService) { }

    @Post()
    @Roles(UserRole.CASHIER, UserRole.MANAGER, UserRole.ADMIN)
    create(@Body() createOrderDto: CreateOrderDto) {
        return this.ordersService.create(createOrderDto);
    }

    @Get()
    @Roles(UserRole.MANAGER, UserRole.ADMIN)
    findAll(@Query('tenantId') tenantId: string) {
        return this.ordersService.findAll(tenantId);
    }

    @Get(':id')
    @Roles(UserRole.CASHIER, UserRole.MANAGER, UserRole.ADMIN)
    findOne(@Param('id') id: string) {
        return this.ordersService.findOne(id);
    }
}
