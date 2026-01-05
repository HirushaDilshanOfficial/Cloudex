import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Order, OrderStatus } from '../orders/entities/order.entity';
import { OrderItem } from '../orders/entities/order-item.entity';
import { startOfDay, endOfDay, subDays, format } from 'date-fns';

@Injectable()
export class AnalyticsService {
    constructor(
        @InjectRepository(Order)
        private ordersRepository: Repository<Order>,
        @InjectRepository(OrderItem)
        private orderItemsRepository: Repository<OrderItem>,
    ) { }

    async getDailySales(tenantId: string) {
        const today = new Date();
        const start = startOfDay(today);
        const end = endOfDay(today);

        const todayOrders = await this.ordersRepository.find({
            where: {
                tenantId,
                createdAt: Between(start, end),
                status: OrderStatus.COMPLETED,
            },
        });

        const totalRevenue = todayOrders.reduce((sum, order) => sum + Number(order.totalAmount), 0);
        const totalOrders = todayOrders.length;
        const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

        return {
            totalRevenue,
            totalOrders,
            avgOrderValue,
        };
    }

    async getSalesTrend(tenantId: string, days: number = 7) {
        const endDate = new Date();
        const startDate = subDays(endDate, days);

        const orders = await this.ordersRepository
            .createQueryBuilder('order')
            .where('order.tenantId = :tenantId', { tenantId })
            .andWhere('order.createdAt >= :startDate', { startDate })
            .andWhere('order.status = :status', { status: OrderStatus.COMPLETED })
            .select("TO_CHAR(order.createdAt, 'YYYY-MM-DD')", 'date')
            .addSelect('SUM(order.totalAmount)', 'revenue')
            .groupBy('date')
            .orderBy('date', 'ASC')
            .getRawMany();

        return orders.map(o => ({
            date: o.date,
            revenue: Number(o.revenue)
        }));
    }

    async getTopSellingProducts(tenantId: string, limit: number = 5) {
        const topProducts = await this.orderItemsRepository
            .createQueryBuilder('orderItem')
            .leftJoinAndSelect('orderItem.product', 'product')
            .leftJoin('orderItem.order', 'order')
            .where('order.tenantId = :tenantId', { tenantId })
            .andWhere('order.status = :status', { status: OrderStatus.COMPLETED })
            .select('product.name', 'name')
            .addSelect('SUM(orderItem.quantity)', 'sold')
            .groupBy('product.id')
            .addGroupBy('product.name')
            .orderBy('sold', 'DESC')
            .limit(limit)
            .getRawMany();

        return topProducts.map(p => ({
            name: p.name,
            sold: Number(p.sold)
        }));
    }
}
