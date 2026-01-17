import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';

import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Injectable()
export class ProductsService {
    constructor(
        @InjectRepository(Product)
        private productsRepository: Repository<Product>,
        private cloudinaryService: CloudinaryService,
    ) { }

    async create(createProductDto: CreateProductDto, file?: Express.Multer.File): Promise<Product> {
        if (file) {
            const result = await this.cloudinaryService.uploadImage(file);
            createProductDto.imageUrl = result.secure_url;
        }
        const product = this.productsRepository.create(createProductDto);
        return this.productsRepository.save(product);
    }

    findAll(tenantId: string): Promise<Product[]> {
        return this.productsRepository.find({ where: { tenantId } });
    }

    findOne(id: string): Promise<Product | null> {
        return this.productsRepository.findOne({ where: { id } });
    }

    async update(id: string, updateProductDto: any, file?: Express.Multer.File): Promise<Product | null> {
        if (file) {
            const result = await this.cloudinaryService.uploadImage(file);
            updateProductDto.imageUrl = result.secure_url;
        }
        await this.productsRepository.update(id, updateProductDto);
        return this.findOne(id);
    }

    async remove(id: string): Promise<void> {
        await this.productsRepository.delete(id);
    }
}
