import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ingredient } from './entities/ingredient.entity';
import { StockMovement, StockMovementType } from './entities/stock-movement.entity';
import { StockAlert, StockAlertStatus } from './entities/stock-alert.entity';

import { InventoryGateway } from './inventory.gateway';

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

    async update(id: string, data: Partial<Ingredient>): Promise<Ingredient | null> {
        await this.ingredientRepository.update(id, data);
        return this.ingredientRepository.findOne({ where: { id } });
    }

    async remove(id: string): Promise<void> {
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
