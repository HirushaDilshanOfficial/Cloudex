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

    async getActiveOrders(tenantId: string, branchId?: string) {
        const where: any = {
            tenantId,
            status: In([OrderStatus.PENDING, OrderStatus.PREPARING]),
        };

        if (branchId) {
            where.branchId = branchId;
        }

        return this.ordersRepository.find({
            where,
            relations: ['items', 'items.product'],
            order: { createdAt: 'ASC' },
        });
    }

    async getCompletedOrders(tenantId: string, branchId?: string) {
        const where: any = {
            tenantId,
            status: In([OrderStatus.COMPLETED, OrderStatus.CANCELLED]),
        };

        if (branchId) {
            where.branchId = branchId;
        }

        return this.ordersRepository.find({
            where,
            relations: ['items', 'items.product'],
            order: { updatedAt: 'DESC' },
            take: 50,
        });
    }

    async updateOrderStatus(orderId: string, status: OrderStatus, tenantId: string, reason?: string) {
        const updateData: any = { status };
        if (status === OrderStatus.CANCELLED && reason) {
            updateData.cancellationReason = reason;
        }

        await this.ordersRepository.update({ id: orderId, tenantId }, updateData);
        const updatedOrder = await this.ordersRepository.findOne({ where: { id: orderId }, relations: ['items', 'items.product'] });

        if (updatedOrder) {
            this.kdsGateway.emitStatusUpdate(tenantId, updatedOrder);
        }
        return updatedOrder;
    }
}
