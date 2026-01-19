
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { TenantsService } from '../tenants/tenants.service';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const tenantsService = app.get(TenantsService);

    const tenantId = 'a1551256-3f15-4135-911f-305a08758959';
    console.log(`Checking tenant with ID: ${tenantId}`);

    const tenant = await tenantsService.findOne(tenantId);
    if (tenant) {
        console.log('Tenant found:', tenant.name);
        console.log('Logo URL:', tenant.logo);
    } else {
        console.log('Tenant NOT found');
    }

    await app.close();
}

bootstrap();
