import { IsString, IsNotEmpty, IsNumber, Min, IsUUID } from 'class-validator';

export class CreateOrderItemDto {
    @IsString()
    @IsNotEmpty()
    @IsUUID()
    productId: string;

    @IsNumber()
    @Min(1)
    quantity: number;

    @IsNumber()
    price: number;
}
