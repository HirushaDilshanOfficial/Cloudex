import { IsString, IsNotEmpty, IsNumber, IsOptional, IsBoolean, IsUUID } from 'class-validator';

export class CreateProductDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsNumber()
    price: number;

    @IsString()
    @IsOptional()
    category?: string;

    @IsBoolean()
    @IsOptional()
    isAvailable?: boolean;

    @IsString()
    @IsOptional()
    imageUrl?: string;

    @IsUUID()
    @IsNotEmpty()
    tenantId: string;
}
