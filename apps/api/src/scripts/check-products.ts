import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { ProductsService } from '../products/products.service';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const productsService = app.get(ProductsService);

    const tenantId = 'a1551256-3f15-4135-911f-305a08758959';
    console.log(`Checking products for tenant: ${tenantId}`);

    const products = await productsService.findAll(tenantId);

    if (products.length === 0) {
        console.log('No products found.');
    } else {
        console.log('Found products:');
        products.forEach(p => console.log(`- ${p.name} (ID: ${p.id})`));
    }

    await app.close();
}

bootstrap();
