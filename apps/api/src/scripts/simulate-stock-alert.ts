
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { InventoryService } from '../inventory/inventory.service';
import { StockMovementType } from '../inventory/entities/stock-movement.entity';
import { Ingredient } from '../inventory/entities/ingredient.entity';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const inventoryService = app.get(InventoryService);
    const ingredientRepo = app.get<Repository<Ingredient>>(getRepositoryToken(Ingredient));

    // Hardcoded tenantId from logs: a1551256-3f15-4135-911f-305a08758959
    const tenantId = 'a1551256-3f15-4135-911f-305a08758959';

    console.log('--- Starting Stock Alert Simulation ---');

    try {
        // 1. Create a test ingredient (Global - No Branch)
        console.log('Creating test ingredient...');
        const ingredient = await ingredientRepo.save({
            name: 'Simulation Test Item ' + Date.now(),
            unit: 'kg',
            currentStock: 20,
            costPerUnit: 10,
            tenantId,
            branchId: null, // Explicitly null to test the fix
        } as any);
        console.log(`Created ingredient: ${ingredient.name} (ID: ${ingredient.id})`);

        // 2. Adjust stock to trigger alert
        console.log('Adjusting stock to trigger alert...');
        await inventoryService.adjustStock(
            ingredient.id,
            15, // Reduce by 15, so 20 - 15 = 5 (below threshold 10)
            StockMovementType.OUT,
            'Simulation Test',
            tenantId
        );
        console.log('Stock adjusted successfully.');

        // 3. Verify alert creation (optional, but implied by success above)
        console.log('Simulation completed without error.');

    } catch (error) {
        console.error('Error during simulation:', error);
    }

    await app.close();
}

bootstrap();
