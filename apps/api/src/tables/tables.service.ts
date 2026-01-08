import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Table } from './entities/table.entity';
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

    findAll(tenantId: string, branchId?: string) {
        const where: any = { tenantId };
        if (branchId) {
            where.branchId = branchId;
        }
        return this.tablesRepository.find({
            where,
            order: { name: 'ASC' },
            relations: ['branch'],
        });
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

    async remove(id: string) {
        const orderCount = await this.ordersRepository.count({ where: { tableId: id } });
        if (orderCount > 0) {
            throw new BadRequestException('Cannot delete table with existing orders. Please archive it instead.');
        }
        return this.tablesRepository.delete(id);
    }
}
