import { TableStatus } from '../entities/table.entity';

export class CreateTableDto {
    name: string;
    capacity: number;
    tenantId: string;
}

export class UpdateTableDto {
    name?: string;
    capacity?: number;
    status?: TableStatus;
}
