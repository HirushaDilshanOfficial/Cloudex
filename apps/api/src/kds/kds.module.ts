import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from '../orders/entities/order.entity';
import { KdsGateway } from './kds.gateway';
import { KdsService } from './kds.service';
import { KdsController } from './kds.controller';

@Module({
    imports: [TypeOrmModule.forFeature([Order])],
    providers: [KdsGateway, KdsService],
    controllers: [KdsController],
    exports: [KdsGateway],
})
export class KdsModule { }
