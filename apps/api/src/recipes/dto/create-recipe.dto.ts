import { IsString, IsNotEmpty, IsUUID, IsArray, ValidateNested, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

class RecipeItemDto {
    @IsUUID()
    @IsNotEmpty()
    ingredientId: string;

    @IsNumber()
    @Min(0)
    quantity: number;

    @IsString()
    @IsNotEmpty()
    unit: string;
}

export class CreateRecipeDto {
    @IsUUID()
    @IsNotEmpty()
    productId: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => RecipeItemDto)
    items: RecipeItemDto[];

    @IsUUID()
    @IsNotEmpty()
    tenantId: string;
}
