import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryService } from './inventory.service';
import { InventoryController } from './inventory.controller';
import { Ingredient } from './entities/ingredient.entity';
import { StockMovement } from './entities/stock-movement.entity';
import { StockAlert } from './entities/stock-alert.entity';
import { InventoryGateway } from './inventory.gateway';

@Module({
    imports: [TypeOrmModule.forFeature([Ingredient, StockMovement, StockAlert])],
    controllers: [InventoryController],
    providers: [InventoryService, InventoryGateway],
    exports: [InventoryService],
})
export class InventoryModule { }
