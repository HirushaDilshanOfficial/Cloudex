import { IsString, IsOptional, IsNotEmpty, IsEnum } from 'class-validator';
import { TenantStatus } from '../entities/tenant.entity';

export class CreateTenantDto {
    @IsEnum(TenantStatus)
    @IsOptional()
    status?: TenantStatus;

    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsOptional()
    domain?: string;

    @IsString()
    @IsOptional()
    address?: string;

    @IsString()
    @IsOptional()
    phone?: string;

    @IsString()
    @IsOptional()
    contactEmail?: string;

    @IsString()
    @IsOptional()
    logo?: string;
}
