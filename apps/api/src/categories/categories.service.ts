import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';

@Injectable()
export class CategoriesService {
    constructor(
        @InjectRepository(Category)
        private categoriesRepository: Repository<Category>,
    ) { }

    create(createCategoryDto: CreateCategoryDto) {
        return this.categoriesRepository.save(createCategoryDto);
    }

    findAll(tenantId: string) {
        return this.categoriesRepository.find({
            where: { tenantId },
            order: { name: 'ASC' },
        });
    }

    async remove(id: string) {
        await this.categoriesRepository.delete(id);
    }

    async seedDefaults(tenantId: string) {
        const defaults = ['Appetizer', 'Main Course', 'Dessert', 'Beverage', 'Sides'];
        const existing = await this.findAll(tenantId);
        const existingNames = new Set(existing.map(c => c.name));

        const toCreate = defaults.filter(name => !existingNames.has(name));

        const entities = toCreate.map(name => this.categoriesRepository.create({ name, tenantId }));
        return this.categoriesRepository.save(entities);
    }
}
