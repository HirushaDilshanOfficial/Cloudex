import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';

@Injectable()
export class ProductsService {
    constructor(
        @InjectRepository(Product)
        private productsRepository: Repository<Product>,
    ) { }

    create(createProductDto: CreateProductDto): Promise<Product> {
        const product = this.productsRepository.create(createProductDto);
        return this.productsRepository.save(product);
    }

    findAll(tenantId: string): Promise<Product[]> {
        return this.productsRepository.find({ where: { tenantId } });
    }

    findOne(id: string): Promise<Product | null> {
        return this.productsRepository.findOne({ where: { id } });
    }

    async update(id: string, updateProductDto: any): Promise<Product | null> {
        await this.productsRepository.update(id, updateProductDto);
        return this.findOne(id);
    }

    async remove(id: string): Promise<void> {
        await this.productsRepository.delete(id);
    }
}
