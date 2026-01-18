import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { InventoryService } from '../inventory/inventory.service';
import { TenantsService } from '../tenants/tenants.service';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const inventoryService = app.get(InventoryService);
    const tenantsService = app.get(TenantsService);

    // Use the specific tenant ID from the user's session
    const tenantId = 'a1551256-3f15-4135-911f-305a08758959';
    console.log(`Seeding ingredients for tenant: ${tenantId}`);

    const ingredients = [
        { name: 'Lime', unit: 'kg', costPerUnit: 450, currentStock: 10 },
        { name: 'Sugar', unit: 'kg', costPerUnit: 280, currentStock: 25 },
        { name: 'Coffee Powder', unit: 'kg', costPerUnit: 3800, currentStock: 5 },
        { name: 'Milk', unit: 'liter', costPerUnit: 520, currentStock: 20 },
        { name: 'Ice Cubes', unit: 'kg', costPerUnit: 120, currentStock: 15 },
        { name: 'All Purpose Flour', unit: 'kg', costPerUnit: 260, currentStock: 25 },
        { name: 'Cocoa Powder', unit: 'kg', costPerUnit: 2400, currentStock: 3 },
        { name: 'Butter', unit: 'kg', costPerUnit: 1850, currentStock: 6 },
        { name: 'Eggs', unit: 'pcs', costPerUnit: 70, currentStock: 200 },
        { name: 'Chocolate Sauce', unit: 'liter', costPerUnit: 1600, currentStock: 5 },
        { name: 'Vanilla Ice Cream', unit: 'liter', costPerUnit: 1200, currentStock: 10 },
        { name: 'Chicken Breast', unit: 'kg', costPerUnit: 1450, currentStock: 20 },
        { name: 'Burger Buns', unit: 'pcs', costPerUnit: 120, currentStock: 100 },
        { name: 'Lettuce', unit: 'kg', costPerUnit: 600, currentStock: 5 },
        { name: 'Tomato', unit: 'kg', costPerUnit: 450, currentStock: 8 },
        { name: 'Mayonnaise', unit: 'kg', costPerUnit: 1100, currentStock: 5 },
        { name: 'Rice (Basmati)', unit: 'kg', costPerUnit: 320, currentStock: 50 },
        { name: 'Cooking Oil', unit: 'liter', costPerUnit: 780, currentStock: 20 },
        { name: 'Carrot', unit: 'kg', costPerUnit: 300, currentStock: 10 },
        { name: 'Cabbage', unit: 'kg', costPerUnit: 250, currentStock: 12 },
        { name: 'Potato', unit: 'kg', costPerUnit: 220, currentStock: 30 },
        { name: 'Spring Roll Sheets', unit: 'pcs', costPerUnit: 45, currentStock: 300 },
        { name: 'Garlic', unit: 'kg', costPerUnit: 900, currentStock: 5 },
        { name: 'Mixed Spices', unit: 'kg', costPerUnit: 2200, currentStock: 4 },
        { name: 'Salt', unit: 'kg', costPerUnit: 180, currentStock: 10 },
        { name: 'Black Pepper', unit: 'kg', costPerUnit: 3500, currentStock: 2 },
    ];

    for (const item of ingredients) {
        try {
            // Check if ingredient already exists for this tenant
            const existing = await inventoryService.findAll(tenantId);
            const exists = existing.find(i => i.name.toLowerCase() === item.name.toLowerCase());

            if (exists) {
                console.log(`Skipped: ${item.name} (Already exists)`);
                continue;
            }

            await inventoryService.createIngredient({
                ...item,
                tenantId,
            });
            console.log(`Added: ${item.name}`);
        } catch (error) {
            console.error(`Failed to add ${item.name}:`, error.message);
        }
    }

    console.log('Seeding complete!');
    await app.close();
}

bootstrap();
