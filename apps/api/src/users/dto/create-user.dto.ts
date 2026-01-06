import { IsString, IsEmail, IsEnum, IsNotEmpty, MinLength, IsUUID, IsOptional } from 'class-validator';
import { UserRole } from '../entities/user.entity';

export class CreateUserDto {
    @IsEmail()
    email: string;

    @IsString()
    @MinLength(6)
    password: string;

    @IsString()
    @IsNotEmpty()
    firstName: string;

    @IsString()
    @IsNotEmpty()
    lastName: string;

    @IsEnum(UserRole)
    role: UserRole;

    @IsUUID()
    @IsNotEmpty()
    tenantId: string;

    @IsUUID()
    @IsOptional()
    branchId?: string;
}
