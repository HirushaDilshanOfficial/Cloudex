import { Controller, Get, Post, Body, Param, Delete, Patch, UseGuards, Query, ParseUUIDPipe, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('products')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProductsController {
    constructor(private readonly productsService: ProductsService) { }

    @Post()
    @Roles(UserRole.ADMIN, UserRole.MANAGER)
    @UseInterceptors(FileInterceptor('image'))
    create(@Body() createProductDto: CreateProductDto, @UploadedFile() file: Express.Multer.File) {
        return this.productsService.create(createProductDto, file);
    }

    @Get()
    findAll(@Query('tenantId', new ParseUUIDPipe()) tenantId: string) {
        return this.productsService.findAll(tenantId);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.productsService.findOne(id);
    }

    @Patch(':id')
    @Roles(UserRole.ADMIN, UserRole.MANAGER)
    @UseInterceptors(FileInterceptor('image'))
    update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto, @UploadedFile() file: Express.Multer.File) {
        return this.productsService.update(id, updateProductDto, file);
    }

    @Delete(':id')
    @Roles(UserRole.ADMIN, UserRole.MANAGER)
    remove(@Param('id') id: string) {
        return this.productsService.remove(id);
    }
}
