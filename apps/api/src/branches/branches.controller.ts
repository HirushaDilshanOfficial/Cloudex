import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { BranchesService } from './branches.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@Controller('branches')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BranchesController {
    constructor(private readonly branchesService: BranchesService) { }

    @Post()
    @Roles(UserRole.ADMIN)
    create(@Body() createBranchDto: CreateBranchDto, @Request() req) {
        return this.branchesService.create(createBranchDto, req.user);
    }

    @Get()
    @Roles(UserRole.ADMIN, UserRole.MANAGER)
    findAll(@Request() req) {
        return this.branchesService.findAll(req.user);
    }

    @Get(':id')
    @Roles(UserRole.ADMIN, UserRole.MANAGER)
    findOne(@Param('id') id: string, @Request() req) {
        return this.branchesService.findOne(id, req.user);
    }

    @Patch(':id')
    @Roles(UserRole.ADMIN)
    update(@Param('id') id: string, @Body() updateBranchDto: UpdateBranchDto, @Request() req) {
        return this.branchesService.update(id, updateBranchDto, req.user);
    }

    @Delete(':id')
    @Roles(UserRole.ADMIN)
    remove(@Param('id') id: string, @Request() req) {
        return this.branchesService.remove(id, req.user);
    }
}
