import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { EventsModule } from '../events/events.module';
import { InventoryModule } from '../inventory/inventory.module';
import { RecipesModule } from '../recipes/recipes.module';

@Module({
    imports: [TypeOrmModule.forFeature([Order, OrderItem]), EventsModule, InventoryModule, RecipesModule],
    controllers: [OrdersController],
    providers: [OrdersService],
    exports: [TypeOrmModule, OrdersService],
})
export class OrdersModule { }
