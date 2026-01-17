import { Controller, Get, Post, Body, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@Controller('categories')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CategoriesController {
    constructor(private readonly categoriesService: CategoriesService) { }

    @Post()
    @Roles(UserRole.ADMIN, UserRole.MANAGER)
    create(@Body() createCategoryDto: CreateCategoryDto) {
        return this.categoriesService.create(createCategoryDto);
    }

    @Post('defaults')
    @Roles(UserRole.ADMIN, UserRole.MANAGER)
    seedDefaults(@Body('tenantId') tenantId: string) {
        return this.categoriesService.seedDefaults(tenantId);
    }

    @Get()
    findAll(@Query('tenantId') tenantId: string) {
        return this.categoriesService.findAll(tenantId);
    }

    @Delete(':id')
    @Roles(UserRole.ADMIN, UserRole.MANAGER)
    remove(@Param('id') id: string) {
        return this.categoriesService.remove(id);
    }
}
