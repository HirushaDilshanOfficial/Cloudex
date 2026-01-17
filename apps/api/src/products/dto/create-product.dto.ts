import { IsString, IsNotEmpty, IsNumber, IsOptional, IsBoolean, IsUUID } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class CreateProductDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsNumber()
    @Type(() => Number)
    price: number;

    @IsNumber()
    @IsOptional()
    @Type(() => Number)
    costPrice?: number;

    @IsString()
    @IsOptional()
    category?: string;

    @IsBoolean()
    @IsOptional()
    @Transform(({ value }) => value === 'true' || value === true)
    isAvailable?: boolean;

    @IsString()
    @IsOptional()
    imageUrl?: string;

    @IsUUID()
    @IsNotEmpty()
    tenantId: string;
}
