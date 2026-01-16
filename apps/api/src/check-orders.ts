
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Order } from './orders/entities/order.entity';
import { DataSource } from 'typeorm';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const dataSource = app.get(DataSource);
    const orderRepo = dataSource.getRepository(Order);

    const orders = await orderRepo.find({ take: 5, order: { createdAt: 'DESC' } });

    console.log('Checking recent orders:');
    orders.forEach(order => {
        console.log(`Order ID: ${order.id}`);
        console.log(`  Status: ${order.status}`);
        console.log(`  Payment Status: ${order.paymentStatus}`);
        console.log('-------------------');
    });

    await app.close();
}

bootstrap();
