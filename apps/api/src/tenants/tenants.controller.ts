import { Controller, Get, Post, Body, Param, UseGuards, Put, Delete } from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('tenants')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TenantsController {
    constructor(private readonly tenantsService: TenantsService) { }

    @Post()
    @Roles(UserRole.SUPER_ADMIN)
    create(@Body() createTenantDto: CreateTenantDto) {
        return this.tenantsService.create(createTenantDto);
    }

    @Get()
    @Roles(UserRole.SUPER_ADMIN)
    findAll() {
        return this.tenantsService.findAll();
    }

    @Get('dashboard-stats')
    @Roles(UserRole.SUPER_ADMIN)
    getDashboardStats() {
        return this.tenantsService.getDashboardStats();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.tenantsService.findOne(id);
    }

    @Put(':id')
    @Roles(UserRole.SUPER_ADMIN)
    update(@Param('id') id: string, @Body() updateTenantDto: any) {
        return this.tenantsService.update(id, updateTenantDto);
    }

    @Delete(':id')
    @Roles(UserRole.SUPER_ADMIN)
    remove(@Param('id') id: string) {
        return this.tenantsService.remove(id);
    }
}
