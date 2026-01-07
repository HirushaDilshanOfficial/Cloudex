import { IsString, IsNotEmpty, IsNumber, IsOptional, IsUUID, Min } from 'class-validator';
import { TableStatus } from '../entities/table.entity';

export class CreateTableDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsNumber()
    @Min(1)
    capacity: number;

    @IsString()
    @IsNotEmpty()
    @IsUUID()
    tenantId: string;

    @IsString()
    @IsOptional()
    @IsUUID()
    branchId?: string;
}

export class UpdateTableDto {
    @IsString()
    @IsOptional()
    name?: string;

    @IsNumber()
    @IsOptional()
    @Min(1)
    capacity?: number;

    @IsString()
    @IsOptional()
    status?: TableStatus;

    @IsString()
    @IsOptional()
    @IsUUID()
    branchId?: string | null;
}
