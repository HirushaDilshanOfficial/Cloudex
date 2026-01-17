import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Order, OrderStatus } from '../orders/entities/order.entity';
import { OrderItem } from '../orders/entities/order-item.entity';
import { startOfDay, endOfDay, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, format } from 'date-fns';

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
        return this.getStatsForPeriod(tenantId, start, end);
    }

    async getWeeklySales(tenantId: string) {
        const today = new Date();
        const start = startOfWeek(today, { weekStartsOn: 1 }); // Monday start
        const end = endOfWeek(today, { weekStartsOn: 1 });
        return this.getStatsForPeriod(tenantId, start, end);
    }

    async getMonthlySales(tenantId: string) {
        const today = new Date();
        const start = startOfMonth(today);
        const end = endOfMonth(today);
        return this.getStatsForPeriod(tenantId, start, end);
    }

    private async getStatsForPeriod(tenantId: string, start: Date, end: Date) {
        const orders = await this.ordersRepository.find({
            where: {
                tenantId,
                createdAt: Between(start, end),
                status: OrderStatus.COMPLETED,
            },
            relations: ['items', 'items.product'],
        });

        const totalRevenue = orders.reduce((sum, order) => sum + Number(order.totalAmount), 0);
        const totalOrders = orders.length;
        const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

        let totalCost = 0;
        for (const order of orders) {
            for (const item of order.items) {
                // Use current product cost as an approximation since we didn't store historical cost
                const cost = item.product?.costPrice ? Number(item.product.costPrice) : 0;
                totalCost += cost * item.quantity;
            }
        }

        const totalProfit = totalRevenue - totalCost;

        return {
            totalRevenue,
            totalOrders,
            avgOrderValue,
            totalProfit,
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

    async getRecentOrders(tenantId: string, limit: number = 5) {
        return this.ordersRepository.find({
            where: { tenantId },
            relations: ['items', 'items.product'],
            order: { createdAt: 'DESC' },
            take: limit,
        });
    }
}
