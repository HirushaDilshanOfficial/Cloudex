
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { EmailService } from '../notifications/email.service';
import { UsersService } from '../users/users.service';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const emailService = app.get(EmailService);
    const usersService = app.get(UsersService);

    // Hardcoded tenantId from logs: a1551256-3f15-4135-911f-305a08758959
    const tenantId = 'a1551256-3f15-4135-911f-305a08758959';

    console.log('--- Starting Email Test ---');

    try {
        const recipients = await usersService.findAdminsAndManagers(tenantId);
        console.log(`Found ${recipients.length} recipients.`);

        if (recipients.length > 0) {
            const targetUser = recipients.find(u => u.email === 'hirushadilshan255@gmail.com') || recipients[0];
            console.log(`Sending test email to: ${targetUser.email}`);

            const testAlert = {
                ingredient: { name: 'Test Ingredient', currentStock: 5, unit: 'kg' },
                threshold: 10,
                branch: { name: 'Test Branch' },
                notes: 'This is a test alert from the debug script.',
            };

            await emailService.sendLowStockAlert(targetUser.email, testAlert);
            console.log('Test email sent successfully.');
        } else {
            console.log('No recipients found.');
        }

    } catch (error) {
        console.error('Error during email test:', error);
    }

    await app.close();
}

bootstrap();
