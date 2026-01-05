import { IsString, IsNotEmpty, IsArray, ValidateNested, IsNumber, IsOptional, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateOrderItemDto } from './create-order-item.dto';

export class CreateOrderDto {
    @IsUUID()
    @IsString()
    tenantId: string;

    @IsString()
    @IsOptional()
    tableId?: string;

    @IsArray()
    @IsOptional()
    cashierId?: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateOrderItemDto)
    items: CreateOrderItemDto[];

    @IsNumber()
    totalAmount: number;
}
