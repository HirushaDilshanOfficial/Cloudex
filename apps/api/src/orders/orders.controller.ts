import { Controller, Get, Post, Body, Param, UseGuards, Query, Request, HttpException, HttpStatus } from '@nestjs/common';
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
    async create(@Body() createOrderDto: CreateOrderDto, @Request() req) {
        console.log('OrdersController.create called');
        try {
            console.log('User from request:', req.user);
            (createOrderDto as any).user = req.user;
            return await this.ordersService.create(createOrderDto);
        } catch (error) {
            console.error('Error in OrdersController.create:', error);
            // Re-throw as HttpException to expose message to client for debugging
            throw new HttpException({
                status: HttpStatus.INTERNAL_SERVER_ERROR,
                error: 'Order creation failed',
                message: error.message || 'Unknown error',
                stack: error.stack // Optional: include stack trace if safe/needed
            }, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Get()
    @Roles(UserRole.MANAGER, UserRole.ADMIN, UserRole.CASHIER)
    findAll(@Query('tenantId') tenantId: string, @Request() req) {
        return this.ordersService.findAll(tenantId, req.user);
    }

    @Get(':id')
    @Roles(UserRole.CASHIER, UserRole.MANAGER, UserRole.ADMIN)
    findOne(@Param('id') id: string) {
        return this.ordersService.findOne(id);
    }
}
