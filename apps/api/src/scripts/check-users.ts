
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { UsersService } from '../users/users.service';
import { UserRole } from '../users/entities/user.entity';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const usersService = app.get(UsersService);

    // Hardcoded tenantId from logs: a1551256-3f15-4135-911f-305a08758959
    const tenantId = 'a1551256-3f15-4135-911f-305a08758959';

    console.log(`Checking users for tenant: ${tenantId}`);

    const adminsAndManagers = await usersService.findAdminsAndManagers(tenantId);
    console.log(`Found ${adminsAndManagers.length} admins/managers:`);
    adminsAndManagers.forEach(u => console.log(`- ${u.email} (${u.role})`));

    await app.close();
}

bootstrap();
