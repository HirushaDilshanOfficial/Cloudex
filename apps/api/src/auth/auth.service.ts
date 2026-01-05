import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { TenantsService } from '../tenants/tenants.service';
import { JwtService } from '@nestjs/jwt';
import { SignUpDto } from './dto/sign-up.dto';
import { UserRole } from '../users/entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private tenantsService: TenantsService,
        private jwtService: JwtService,
    ) { }

    async validateUser(email: string, pass: string): Promise<any> {
        const user = await this.usersService.findOneByEmail(email);
        if (user && (await bcrypt.compare(pass, user.passwordHash))) {
            const { passwordHash, ...result } = user;
            return result;
        }
        return null;
    }

    async login(user: any) {
        const payload = { email: user.email, sub: user.id, role: user.role, tenantId: user.tenantId };
        return {
            access_token: this.jwtService.sign(payload),
        };
    }

    async signUp(signUpDto: SignUpDto) {
        // 1. Create Tenant
        const tenant = await this.tenantsService.create({
            name: signUpDto.restaurantName,
            address: 'N/A', // Placeholder
            contactEmail: signUpDto.email,
            phone: 'N/A', // Placeholder
        });

        // 2. Create Admin User
        const user = await this.usersService.create({
            email: signUpDto.email,
            password: signUpDto.password,
            firstName: signUpDto.firstName,
            lastName: signUpDto.lastName,
            role: UserRole.ADMIN,
            tenantId: tenant.id,
        });

        // 3. Login (Return Token)
        return this.login(user);
    }

    async register(createUserDto: any) {
        return this.usersService.create(createUserDto);
    }
}
