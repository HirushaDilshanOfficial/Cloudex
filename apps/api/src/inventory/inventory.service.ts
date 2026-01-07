import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ingredient } from './entities/ingredient.entity';
import { StockMovement, StockMovementType } from './entities/stock-movement.entity';

@Injectable()
export class InventoryService {
    constructor(
        @InjectRepository(Ingredient)
        private ingredientRepository: Repository<Ingredient>,
        @InjectRepository(StockMovement)
        private stockMovementRepository: Repository<StockMovement>,
    ) { }

    async createIngredient(data: Partial<Ingredient>): Promise<Ingredient> {
        const ingredient = this.ingredientRepository.create(data);
        return this.ingredientRepository.save(ingredient);
    }

    findAll(tenantId: string, branchId?: string): Promise<Ingredient[]> {
        const where: any = { tenantId };
        if (branchId) {
            where.branchId = branchId;
        }
        return this.ingredientRepository.find({ where, relations: ['branch'] });
    }

    async adjustStock(
        ingredientId: string,
        quantity: number,
        type: StockMovementType,
        reason: string,
        tenantId: string,
        branchId?: string,
    ): Promise<Ingredient> {
        const where: any = { id: ingredientId };
        // Optionally enforce branch check if branchId is provided
        // if (branchId) where.branchId = branchId; 

        const ingredient = await this.ingredientRepository.findOne({ where });
        if (!ingredient) throw new Error('Ingredient not found');

        // Update current stock
        if (type === StockMovementType.IN) {
            ingredient.currentStock = Number(ingredient.currentStock) + Number(quantity);
        } else {
            ingredient.currentStock = Number(ingredient.currentStock) - Number(quantity);
        }

        await this.ingredientRepository.save(ingredient);

        // Record movement
        await this.stockMovementRepository.save({
            ingredientId,
            type,
            quantity,
            reason,
            tenantId,
        });

        return ingredient;
    }
}
