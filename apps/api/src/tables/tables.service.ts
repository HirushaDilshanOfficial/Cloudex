import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Table } from './entities/table.entity';
import { CreateTableDto, UpdateTableDto } from './dto/create-table.dto';

@Injectable()
export class TablesService {
    constructor(
        @InjectRepository(Table)
        private tablesRepository: Repository<Table>,
    ) { }

    create(createTableDto: CreateTableDto) {
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
        await this.tablesRepository.update(id, updateTableDto);
        return this.findOne(id);
    }

    remove(id: string) {
        return this.tablesRepository.delete(id);
    }
}
