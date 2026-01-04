import { IsString, IsNotEmpty, IsArray, ValidateNested, IsNumber, IsOptional, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateOrderItemDto } from './create-order-item.dto';

export class CreateOrderDto {
    @IsUUID()
    @IsNotEmpty()
    tenantId: string;

    @IsUUID()
    @IsOptional()
    cashierId?: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateOrderItemDto)
    items: CreateOrderItemDto[];

    @IsNumber()
    totalAmount: number;
}
