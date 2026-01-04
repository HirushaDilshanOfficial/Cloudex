import { Controller, Get, Post, Body, Param, UseGuards, Query } from '@nestjs/common';
import { RecipesService } from './recipes.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@Controller('recipes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RecipesController {
    constructor(private readonly recipesService: RecipesService) { }

    @Post()
    @Roles(UserRole.MANAGER, UserRole.ADMIN)
    create(@Body() data: any) {
        return this.recipesService.create(data);
    }

    @Get()
    findAll(@Query('tenantId') tenantId: string) {
        return this.recipesService.findAll(tenantId);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.recipesService.findOne(id);
    }
}
