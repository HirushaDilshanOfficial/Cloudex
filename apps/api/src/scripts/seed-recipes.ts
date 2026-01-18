import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { RecipesService } from '../recipes/recipes.service';
import { ProductsService } from '../products/products.service';
import { InventoryService } from '../inventory/inventory.service';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const recipesService = app.get(RecipesService);
    const productsService = app.get(ProductsService);
    const inventoryService = app.get(InventoryService);

    const tenantId = 'a1551256-3f15-4135-911f-305a08758959';
    console.log(`Seeding recipes for tenant: ${tenantId}`);

    // Fetch all products and ingredients
    const products = await productsService.findAll(tenantId);
    const ingredients = await inventoryService.findAll(tenantId);

    const productMap = new Map(products.map(p => [p.name, p.id]));
    const ingredientMap = new Map(ingredients.map(i => [i.name, i.id]));

    const recipesToCreate = [
        {
            productName: 'Fresh Lime Juice',
            items: [
                { ingredientName: 'Lime', quantity: 0.05 },
                { ingredientName: 'Sugar', quantity: 0.02 },
                { ingredientName: 'Ice Cubes', quantity: 0.1 },
            ]
        },
        {
            productName: 'Chocolate Brownie',
            items: [
                { ingredientName: 'All Purpose Flour', quantity: 0.05 },
                { ingredientName: 'Cocoa Powder', quantity: 0.02 },
                { ingredientName: 'Butter', quantity: 0.03 },
                { ingredientName: 'Eggs', quantity: 1 },
                { ingredientName: 'Sugar', quantity: 0.05 },
            ]
        },
        {
            productName: 'Vanilla Ice Cream',
            items: [
                { ingredientName: 'Vanilla Ice Cream', quantity: 0.15 },
                { ingredientName: 'Chocolate Sauce', quantity: 0.02 },
            ]
        },
        {
            productName: 'Classic Chicken Burger',
            items: [
                { ingredientName: 'Burger Buns', quantity: 1 },
                { ingredientName: 'Chicken Breast', quantity: 0.15 },
                { ingredientName: 'Lettuce', quantity: 0.02 },
                { ingredientName: 'Tomato', quantity: 0.03 },
                { ingredientName: 'Mayonnaise', quantity: 0.01 },
            ]
        },
        {
            productName: 'Chicken Fried Rice',
            items: [
                { ingredientName: 'Rice (Basmati)', quantity: 0.2 },
                { ingredientName: 'Chicken Breast', quantity: 0.1 },
                { ingredientName: 'Carrot', quantity: 0.05 },
                { ingredientName: 'Cabbage', quantity: 0.05 },
                { ingredientName: 'Cooking Oil', quantity: 0.02 },
                { ingredientName: 'Eggs', quantity: 1 },
                { ingredientName: 'Salt', quantity: 0.005 },
                { ingredientName: 'Black Pepper', quantity: 0.002 },
            ]
        },
        {
            productName: 'French Fries',
            items: [
                { ingredientName: 'Potato', quantity: 0.25 },
                { ingredientName: 'Cooking Oil', quantity: 0.05 },
                { ingredientName: 'Salt', quantity: 0.002 },
            ]
        },
        {
            productName: 'Coleslaw Salad',
            items: [
                { ingredientName: 'Cabbage', quantity: 0.15 },
                { ingredientName: 'Carrot', quantity: 0.05 },
                { ingredientName: 'Mayonnaise', quantity: 0.03 },
            ]
        },
        {
            productName: 'Chicken Spring Rolls',
            items: [
                { ingredientName: 'Spring Roll Sheets', quantity: 2 },
                { ingredientName: 'Chicken Breast', quantity: 0.05 },
                { ingredientName: 'Cabbage', quantity: 0.03 },
                { ingredientName: 'Carrot', quantity: 0.02 },
                { ingredientName: 'Cooking Oil', quantity: 0.01 },
            ]
        },
        {
            productName: 'Iced Coffee',
            items: [
                { ingredientName: 'Coffee Powder', quantity: 0.015 },
                { ingredientName: 'Milk', quantity: 0.1 },
                { ingredientName: 'Sugar', quantity: 0.02 },
                { ingredientName: 'Ice Cubes', quantity: 0.1 },
            ]
        },
        {
            productName: 'Garlic Bread',
            items: [
                { ingredientName: 'Burger Buns', quantity: 1 }, // Using buns as base
                { ingredientName: 'Garlic', quantity: 0.01 },
                { ingredientName: 'Butter', quantity: 0.02 },
            ]
        }
    ];

    for (const recipeData of recipesToCreate) {
        const productId = productMap.get(recipeData.productName);
        if (!productId) {
            console.warn(`Product not found: ${recipeData.productName}`);
            continue;
        }

        // Check if recipe already exists
        let recipe = await recipesService.findByProduct(productId);

        if (recipe) {
            console.log(`Updating existing recipe for: ${recipeData.productName}`);
            // Update logic will be handled below by creating new items
        } else {
            console.log(`Creating new recipe for: ${recipeData.productName}`);
            // Create empty recipe first
            recipe = await recipesService.create({
                productId,
                items: [],
                tenantId,
            });
        }

        const items: { ingredientId: string; quantity: number; unit: string }[] = [];
        for (const item of recipeData.items) {
            const ingredientId = ingredientMap.get(item.ingredientName);
            if (!ingredientId) {
                console.warn(`Ingredient not found: ${item.ingredientName}`);
                continue;
            }
            items.push({
                ingredientId,
                quantity: item.quantity,
                unit: 'unit' // Default unit
            });
        }

        if (items.length > 0) {
            try {
                // Use update method which handles item replacement
                await recipesService.update(recipe.id, {
                    items,
                });
                console.log(`Successfully mapped ingredients for: ${recipeData.productName}`);
            } catch (error) {
                console.error(`Failed to update recipe for ${recipeData.productName}`, error);
            }
        }
    }

    console.log('Recipe seeding complete!');
    await app.close();
}

bootstrap();
