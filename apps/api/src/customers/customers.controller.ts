import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, Request } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@Controller('customers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CustomersController {
    constructor(private readonly customersService: CustomersService) { }

    @Post()
    @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER)
    create(@Body() createCustomerDto: any) {
        return this.customersService.create(createCustomerDto);
    }

    @Get()
    @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER)
    findAll(@Query('tenantId') tenantId: string, @Request() req) {
        const targetTenantId = req.user?.tenantId || tenantId;
        return this.customersService.findAll(targetTenantId);
    }

    @Get('search')
    @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER)
    findByPhone(@Query('tenantId') tenantId: string, @Query('phone') phone: string, @Request() req) {
        const targetTenantId = req.user?.tenantId || tenantId;
        return this.customersService.findByPhone(targetTenantId, phone);
    }

    @Get(':id')
    @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER)
    findOne(@Param('id') id: string) {
        return this.customersService.findOne(id);
    }

    @Patch(':id')
    @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER)
    update(@Param('id') id: string, @Body() updateCustomerDto: any) {
        return this.customersService.update(id, updateCustomerDto);
    }

    @Delete(':id')
    @Roles(UserRole.ADMIN, UserRole.MANAGER)
    remove(@Param('id') id: string) {
        return this.customersService.remove(id);
    }
}
