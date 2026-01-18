import { Controller, Get, Post, Body, Param, UseGuards, Query, Delete, Patch } from '@nestjs/common';
import { RecipesService } from './recipes.service';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { UpdateRecipeDto } from './dto/update-recipe.dto';
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
    create(@Body() createRecipeDto: CreateRecipeDto) {
        return this.recipesService.create(createRecipeDto);
    }

    @Get()
    findAll(@Query('tenantId') tenantId: string) {
        return this.recipesService.findAll(tenantId);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.recipesService.findOne(id);
    }

    @Patch(':id')
    @Roles(UserRole.MANAGER, UserRole.ADMIN)
    update(@Param('id') id: string, @Body() updateRecipeDto: UpdateRecipeDto) {
        return this.recipesService.update(id, updateRecipeDto);
    }

    @Delete(':id')
    @Roles(UserRole.MANAGER, UserRole.ADMIN)
    remove(@Param('id') id: string) {
        return this.recipesService.remove(id);
    }
}
