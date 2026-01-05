import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { EventsGateway } from '../events/events.gateway';
import { InventoryService } from '../inventory/inventory.service';
import { RecipesService } from '../recipes/recipes.service';
import { StockMovementType } from '../inventory/entities/stock-movement.entity';
import { KdsGateway } from '../kds/kds.gateway';

@Injectable()
export class OrdersService {
    constructor(
        @InjectRepository(Order)
        private ordersRepository: Repository<Order>,
        @InjectRepository(OrderItem)
        private orderItemsRepository: Repository<OrderItem>,
        private eventsGateway: EventsGateway,
        private inventoryService: InventoryService,
        private recipesService: RecipesService,
        private kdsGateway: KdsGateway,
    ) { }

    async create(createOrderDto: CreateOrderDto): Promise<Order> {
        const { items, ...orderData } = createOrderDto;

        const order = this.ordersRepository.create({
            ...orderData,
            status: OrderStatus.PENDING,
        });

        const savedOrder = await this.ordersRepository.save(order);

        const orderItems = items.map((item) =>
            this.orderItemsRepository.create({
                ...item,
                order: savedOrder,
            }),
        );

        await this.orderItemsRepository.save(orderItems);

        // Deduct stock based on recipes
        for (const item of items) {
            const recipe = await this.recipesService.findByProduct(item.productId);
            if (recipe) {
                for (const recipeItem of recipe.items) {
                    await this.inventoryService.adjustStock(
                        recipeItem.ingredientId,
                        recipeItem.quantity * item.quantity,
                        StockMovementType.OUT,
                        `Order #${savedOrder.id}`,
                        savedOrder.tenantId,
                    );
                }
            }
        }

        const fullOrder = await this.findOne(savedOrder.id);
        this.eventsGateway.emitOrderUpdate(fullOrder.tenantId, fullOrder);
        this.kdsGateway.emitNewOrder(fullOrder.tenantId, fullOrder);

        return fullOrder;
    }

    findAll(tenantId: string): Promise<Order[]> {
        return this.ordersRepository.find({
            where: { tenantId },
            relations: ['items', 'items.product', 'cashier', 'table'],
            order: { createdAt: 'DESC' },
        });
    }

    async findOne(id: string): Promise<Order> {
        const order = await this.ordersRepository.findOne({
            where: { id },
            relations: ['items', 'items.product', 'cashier', 'table'],
        });
        if (!order) {
            throw new Error('Order not found');
        }
        return order;
    }
}
