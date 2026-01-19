
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { UsersService } from '../users/users.service';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const usersService = app.get(UsersService);

    const userId = '1ff4a3a0-1180-470d-b6b1-84b9910c1b3d';
    console.log(`Checking user with ID: ${userId}`);

    const user = await usersService.findOne(userId);
    if (user) {
        console.log('User found:', user.email);
    } else {
        console.log('User NOT found');
    }

    await app.close();
}

bootstrap();
