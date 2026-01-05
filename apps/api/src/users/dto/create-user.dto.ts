import { IsString, IsEmail, IsEnum, IsNotEmpty, MinLength, IsUUID } from 'class-validator';
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
}
