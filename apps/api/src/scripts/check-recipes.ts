import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { RecipesService } from '../recipes/recipes.service';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const recipesService = app.get(RecipesService);

    const tenantId = 'a1551256-3f15-4135-911f-305a08758959';
    console.log(`Checking recipes for tenant: ${tenantId}`);

    const recipes = await recipesService.findAll(tenantId);

    if (recipes.length === 0) {
        console.log('No recipes found.');
    } else {
        console.log(`Found ${recipes.length} recipes:`);
        recipes.forEach(r => {
            console.log(`- Product: ${r.product?.name} (ID: ${r.product?.id})`);
            if (r.items && r.items.length > 0) {
                console.log('  Ingredients:');
                r.items.forEach(i => {
                    console.log(`    - ${i.ingredient?.name}: ${i.quantity} ${i.ingredient?.unit}`);
                });
            } else {
                console.log('  No ingredients mapped.');
            }
        });
    }

    await app.close();
}

bootstrap();
