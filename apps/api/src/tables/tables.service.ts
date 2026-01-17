import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Table, TableStatus } from './entities/table.entity';
import { Order } from '../orders/entities/order.entity';
import { CreateTableDto, UpdateTableDto } from './dto/create-table.dto';

@Injectable()
export class TablesService {
    constructor(
        @InjectRepository(Table)
        private tablesRepository: Repository<Table>,
        @InjectRepository(Order)
        private ordersRepository: Repository<Order>,
    ) { }

    create(createTableDto: CreateTableDto) {
        // Handle empty string branchId which comes from frontend select default
        if (createTableDto.branchId === '') {
            delete createTableDto.branchId;
        }
        const table = this.tablesRepository.create(createTableDto);
        return this.tablesRepository.save(table);
    }

    async findAll(tenantId: string, branchId?: string) {
        const where: any = { tenantId, isArchived: false };
        if (branchId) {
            where.branchId = branchId;
        }

        // Auto-release locked tables
        const tables = await this.tablesRepository.find({
            where,
            order: { name: 'ASC' },
            relations: ['branch'],
        });

        const twentyMinutesAgo = new Date(Date.now() - 20 * 60 * 1000);

        for (const table of tables) {
            if (table.status === TableStatus.OCCUPIED && table.lastOrderTime && new Date(table.lastOrderTime) < twentyMinutesAgo) {
                await this.tablesRepository.update(table.id, { status: TableStatus.AVAILABLE, lastOrderTime: null as any });
                table.status = TableStatus.AVAILABLE;
                table.lastOrderTime = null as any;
            }
        }

        return tables;
    }

    findOne(id: string) {
        return this.tablesRepository.findOne({ where: { id }, relations: ['branch'] });
    }

    async update(id: string, updateTableDto: UpdateTableDto) {
        if (updateTableDto.branchId === '') {
            (updateTableDto as any).branchId = null;
        }
        await this.tablesRepository.update(id, updateTableDto as any);
        return this.findOne(id);
    }

    async updateStatus(id: string, status: string) {
        const updateData: any = { status: status as any };
        if (status === TableStatus.OCCUPIED) {
            updateData.lastOrderTime = new Date();
        } else if (status === TableStatus.AVAILABLE) {
            updateData.lastOrderTime = null as any;
        }
        await this.tablesRepository.update(id, updateData);
        return this.findOne(id);
    }

    async archive(id: string) {
        await this.tablesRepository.update(id, { isArchived: true });
        return this.findOne(id);
    }

    async remove(id: string) {
        const orderCount = await this.ordersRepository.count({ where: { tableId: id } });
        if (orderCount > 0) {
            throw new BadRequestException('Cannot delete table with existing orders. Please archive it instead.');
        }
        return this.tablesRepository.delete(id);
    }

    async cleanup(tenantId: string) {
        if (!tenantId) {
            throw new BadRequestException('Tenant ID is required for cleanup');
        }

        try {
            // Find all tables for this tenant
            const tables = await this.tablesRepository.find({ where: { tenantId } });
            const results = { deleted: 0, archived: 0, errors: 0 };

            for (const table of tables) {
                try {
                    const orderCount = await this.ordersRepository.count({ where: { tableId: table.id } });
                    if (orderCount > 0) {
                        await this.archive(table.id);
                        results.archived++;
                    } else {
                        await this.tablesRepository.delete(table.id);
                        results.deleted++;
                    }
                } catch (e) {
                    console.error(`Failed to cleanup table ${table.id}`, e);
                    results.errors++;
                }
            }
            return results;
        } catch (error) {
            console.error('Cleanup failed', error);
            throw error;
        }
    }
}
