import { IsString, IsNotEmpty, IsNumber, Min } from 'class-validator';

export class CreateOrderItemDto {
    @IsString()
    @IsNotEmpty()
    productId: string;

    @IsNumber()
    @Min(1)
    quantity: number;

    @IsNumber()
    price: number;
}
