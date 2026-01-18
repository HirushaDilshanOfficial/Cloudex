import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ingredient } from './entities/ingredient.entity';
import { StockMovement, StockMovementType } from './entities/stock-movement.entity';
import { StockAlert, StockAlertStatus } from './entities/stock-alert.entity';

import { InventoryGateway } from './inventory.gateway';
import { RecipesService } from '../recipes/recipes.service';

@Injectable()
export class InventoryService {
    constructor(
        @InjectRepository(Ingredient)
        private ingredientRepository: Repository<Ingredient>,
        @InjectRepository(StockMovement)
        private stockMovementRepository: Repository<StockMovement>,
        @InjectRepository(StockAlert)
        private stockAlertRepository: Repository<StockAlert>,
        private inventoryGateway: InventoryGateway,
        private recipesService: RecipesService,
    ) { }

    async createIngredient(data: Partial<Ingredient>): Promise<Ingredient> {
        const ingredient = this.ingredientRepository.create(data);
        return this.ingredientRepository.save(ingredient);
    }

    async findAll(tenantId: string, branchId?: string): Promise<Ingredient[]> {
        console.log(`InventoryService.findAll called with tenantId: ${tenantId}, branchId: ${branchId}`);
        const where: any = { tenantId };
        if (branchId) {
            where.branchId = branchId;
            // Also include items with no branch (global items)
            const items = await this.ingredientRepository.find({
                where: [
                    { tenantId, branchId },
                    { tenantId, branchId: null } as any
                ],
                relations: ['branch']
            });
            console.log(`Found ${items.length} ingredients (filtered by branch + global)`);
            return items;
        }
        const items = await this.ingredientRepository.find({ where, relations: ['branch'] });
        console.log(`Found ${items.length} ingredients (all branch)`);
        return items;
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

    async update(id: string, data: Partial<Ingredient>): Promise<Ingredient | null> {
        await this.ingredientRepository.update(id, data);
        return this.ingredientRepository.findOne({ where: { id } });
    }

    async remove(id: string): Promise<void> {
        // Check if used in recipes
        const recipes = await this.recipesService.findRecipesByIngredient(id);
        if (recipes.length > 0) {
            const recipeNames = recipes.map(r => r.product?.name || 'Unknown Product').join(', ');
            throw new BadRequestException(`Cannot delete ingredient because it is used in the following recipes: ${recipeNames}`);
        }

        await this.ingredientRepository.delete(id);
    }

    async createAlert(data: Partial<StockAlert>): Promise<StockAlert> {
        const alert = this.stockAlertRepository.create(data);
        const savedAlert = await this.stockAlertRepository.save(alert);

        // Fetch relations to send complete data in notification
        const fullAlert = await this.stockAlertRepository.findOne({
            where: { id: savedAlert.id },
            relations: ['ingredient', 'branch'],
        });

        if (fullAlert) {
            this.inventoryGateway.notifyStockAlert(fullAlert, fullAlert.tenantId, fullAlert.branchId);
        }

        return savedAlert;
    }

    async getAlerts(tenantId: string, branchId?: string): Promise<StockAlert[]> {
        const where: any = { tenantId, status: StockAlertStatus.PENDING };
        if (branchId) {
            where.branchId = branchId;
        }
        return this.stockAlertRepository.find({
            where,
            relations: ['ingredient', 'branch'],
            order: { createdAt: 'DESC' },
        });
    }

    async resolveAlert(id: string): Promise<StockAlert> {
        const alert = await this.stockAlertRepository.findOne({ where: { id } });
        if (!alert) throw new Error('Alert not found');
        alert.status = StockAlertStatus.RESOLVED;
        return this.stockAlertRepository.save(alert);
    }
}
