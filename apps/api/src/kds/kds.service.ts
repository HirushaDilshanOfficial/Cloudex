import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Order, OrderStatus } from '../orders/entities/order.entity';
import { KdsGateway } from './kds.gateway';

@Injectable()
export class KdsService {
    constructor(
        @InjectRepository(Order)
        private ordersRepository: Repository<Order>,
        private kdsGateway: KdsGateway,
    ) { }

    async getActiveOrders(tenantId: string) {
        return this.ordersRepository.find({
            where: {
                tenantId,
                status: In([OrderStatus.PENDING, OrderStatus.PREPARING]),
            },
            relations: ['items', 'items.product'],
            order: { createdAt: 'ASC' },
        });
    }

    async updateOrderStatus(orderId: string, status: OrderStatus, tenantId: string) {
        await this.ordersRepository.update({ id: orderId, tenantId }, { status });
        const updatedOrder = await this.ordersRepository.findOne({ where: { id: orderId }, relations: ['items', 'items.product'] });

        if (updatedOrder) {
            this.kdsGateway.emitStatusUpdate(tenantId, updatedOrder);
        }
        return updatedOrder;
    }
}
