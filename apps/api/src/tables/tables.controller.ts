import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, Request } from '@nestjs/common';
import { TablesService } from './tables.service';
import { CreateTableDto, UpdateTableDto } from './dto/create-table.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@Controller('tables')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TablesController {
    constructor(private readonly tablesService: TablesService) { }

    @Post()
    @Roles(UserRole.ADMIN, UserRole.MANAGER)
    create(@Body() createTableDto: CreateTableDto) {
        return this.tablesService.create(createTableDto);
    }

    @Get()
    @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER, UserRole.KITCHEN)
    findAll(@Query('tenantId') tenantId: string, @Request() req) {
        return this.tablesService.findAll(tenantId, req.user?.branchId);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.tablesService.findOne(id);
    }

    @Patch(':id')
    @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER)
    update(@Param('id') id: string, @Body() updateTableDto: UpdateTableDto) {
        return this.tablesService.update(id, updateTableDto);
    }

    @Patch(':id/status')
    @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER)
    updateStatus(@Param('id') id: string, @Body('status') status: string) {
        return this.tablesService.updateStatus(id, status);
    }

    @Patch(':id/archive')
    @Roles(UserRole.ADMIN, UserRole.MANAGER)
    archive(@Param('id') id: string) {
        console.log(`Archiving table ${id}`);
        return this.tablesService.archive(id);
    }

    @Delete('bulk-cleanup')
    @Roles(UserRole.ADMIN, UserRole.MANAGER)
    cleanup(@Query('tenantId') tenantId: string, @Request() req) {
        console.log('Hit bulk-cleanup endpoint');
        // Use tenantId from token if not provided in query (for safety)
        const targetTenantId = req.user?.tenantId || tenantId;
        return this.tablesService.cleanup(targetTenantId);
    }

    @Delete(':id')
    @Roles(UserRole.ADMIN, UserRole.MANAGER)
    remove(@Param('id') id: string) {
        return this.tablesService.remove(id);
    }
}
