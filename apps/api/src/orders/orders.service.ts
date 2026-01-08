import { Injectable, BadRequestException } from '@nestjs/common';
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
        const fs = require('fs');
        try {
            fs.writeFileSync('/Users/hirushadilshan/Desktop/Cloudex/apps/api/debug_entry.json', JSON.stringify(createOrderDto, null, 2));
        } catch (e) {
            console.error('Failed to write debug file', e);
        }

        console.log('Creating order with DTO:', JSON.stringify(createOrderDto));
        const { items, tenantId, tableId, cashierId, totalAmount } = createOrderDto;
        const user = (createOrderDto as any).user;

        // Manual validation safety net
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(tenantId)) {
            throw new BadRequestException(`Invalid tenantId: ${tenantId}. Must be a UUID.`);
        }
        if (tableId && !uuidRegex.test(tableId)) {
            throw new BadRequestException(`Invalid tableId: ${tableId}. Must be a UUID.`);
        }
        if (cashierId && !uuidRegex.test(cashierId)) {
            throw new BadRequestException(`Invalid cashierId: ${cashierId}. Must be a UUID.`);
        } else if (!cashierId && user?.userId && !uuidRegex.test(user.userId)) {
            // If cashierId is not in DTO, we might want to use user.userId, but if it's invalid, we should warn/block
            console.warn(`Invalid userId from token: ${user.userId}. Cannot set as cashierId.`);
            // We don't set cashierId if it's invalid
        }

        // Validate items
        if (items && items.length > 0) {
            for (const item of items) {
                if (!uuidRegex.test(item.productId)) {
                    throw new BadRequestException(`Invalid productId: ${item.productId}. Must be a UUID.`);
                }
            }
        }

        let branchId = user?.branchId;
        if (branchId && !uuidRegex.test(branchId)) {
            console.warn(`Invalid branchId from user token: ${branchId}. Setting to null.`);
            branchId = null;
        }

        try {
            const order = this.ordersRepository.create({
                tenantId,
                tableId,
                cashierId,
                totalAmount,
                status: OrderStatus.PENDING,
                branchId,
            });

            console.log('Attempting to save order with data:', JSON.stringify({
                tenantId,
                tableId,
                cashierId,
                branchId,
                totalAmount
            }));

            console.log('Saving order header...');
            const savedOrder = await this.ordersRepository.save(order);
            console.log('Order header saved:', savedOrder.id);

            const orderItems = items.map((item) =>
                this.orderItemsRepository.create({
                    ...item,
                    order: savedOrder,
                }),
            );

            console.log('Saving order items...');
            await this.orderItemsRepository.save(orderItems);
            console.log('Order items saved');

            // Deduct stock based on recipes
            console.log('Processing inventory...');
            for (const item of items) {
                const recipe = await this.recipesService.findByProduct(item.productId);
                if (recipe) {
                    console.log(`Found recipe for product ${item.productId}`);
                    for (const recipeItem of recipe.items) {
                        if (!uuidRegex.test(recipeItem.ingredientId)) {
                            console.warn(`Skipping inventory adjustment for invalid ingredientId: ${recipeItem.ingredientId}`);
                            continue;
                        }
                        try {
                            await this.inventoryService.adjustStock(
                                recipeItem.ingredientId,
                                recipeItem.quantity * item.quantity,
                                StockMovementType.OUT,
                                `Order #${savedOrder.id}`,
                                savedOrder.tenantId,
                            );
                        } catch (invError) {
                            console.error(`Inventory adjustment failed for ingredient ${recipeItem.ingredientId}`, invError);
                            // Optionally throw a user-friendly error, but for now log and continue or throw specific
                            throw new BadRequestException(`Failed to update stock for ingredient ${recipeItem.ingredientId}: ${invError.message}`);
                        }
                    }
                }
            }
            console.log('Inventory processed');

            const fullOrder = await this.findOne(savedOrder.id);

            try {
                this.eventsGateway.emitOrderUpdate(fullOrder.tenantId, fullOrder);
                this.kdsGateway.emitNewOrder(fullOrder.tenantId, fullOrder);
            } catch (gwError) {
                console.error('Gateway emit failed', gwError);
                // Don't fail the order if gateway fails
            }

            return fullOrder;
        } catch (error) {
            console.error('Error creating order:', error);
            // Write debug info to file
            const fs = require('fs');
            const debugData = {
                timestamp: new Date().toISOString(),
                error: error.message,
                stack: error.stack,
                dto: createOrderDto,
                user: user,
                sanitizedBranchId: branchId
            };
            fs.writeFileSync('/Users/hirushadilshan/Desktop/Cloudex/debug_order_error.json', JSON.stringify(debugData, null, 2));
            throw error;
        }
    }

    findAll(tenantId: string, user?: any): Promise<Order[]> {
        const where: any = { tenantId };

        // If user is not admin and has a branchId, filter by branch
        if (user && user.role !== 'admin' && user.branchId) {
            where.branchId = user.branchId;
        }

        return this.ordersRepository.find({
            where,
            relations: ['items', 'items.product', 'cashier', 'table', 'branch'],
            order: { createdAt: 'DESC' },
        });
    }

    async findOne(id: string): Promise<Order> {
        const order = await this.ordersRepository.findOne({
            where: { id },
            relations: ['items', 'items.product', 'cashier', 'table', 'branch'],
        });
        if (!order) {
            throw new Error('Order not found');
        }
        return order;
    }
}
