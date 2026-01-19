import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { TenantsService } from '../tenants/tenants.service';
import { JwtService } from '@nestjs/jwt';
import { SignUpDto } from './dto/sign-up.dto';
import { UserRole } from '../users/entities/user.entity';
import * as bcrypt from 'bcrypt';
import { EmailService } from '../notifications/email.service';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private tenantsService: TenantsService,
        private jwtService: JwtService,
        private emailService: EmailService,
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
        const payload = {
            email: user.email,
            sub: user.id,
            role: user.role,
            tenantId: user.tenantId,
            branchId: user.branchId,
            branchName: user.branch?.name
        };
        return {
            access_token: this.jwtService.sign(payload),
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                tenantId: user.tenantId,
                branchId: user.branchId,
                branchName: user.branch?.name
            }
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

    async forgotPassword(email: string) {
        const user = await this.usersService.findOneByEmail(email);
        if (!user) {
            // We don't want to reveal if a user exists or not
            return { message: 'If a user with this email exists, a password reset link has been sent.' };
        }

        // Restrict to ADMIN only
        if (user.role !== UserRole.ADMIN) {
            console.warn(`Password reset attempted for non-admin user: ${email}`);
            // Return success message to avoid enumeration, but do NOT send email
            return { message: 'If a user with this email exists, a password reset link has been sent.' };
        }

        // Generate a random token
        const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        const expires = new Date();
        expires.setHours(expires.getHours() + 1); // 1 hour expiration

        // Save token to user
        await this.usersService.update(user.id, {
            resetPasswordToken: token,
            resetPasswordExpires: expires,
        });

        // Send email
        await this.emailService.sendPasswordResetEmail(email, token);

        return { message: 'If a user with this email exists, a password reset link has been sent.' };
    }

    async resetPassword(token: string, newPassword: string) {
        const user = await this.usersService.findOneByResetToken(token);

        if (!user || user.resetPasswordExpires < new Date()) {
            throw new UnauthorizedException('Invalid or expired password reset token');
        }

        const salt = await bcrypt.genSalt();
        const passwordHash = await bcrypt.hash(newPassword, salt);

        await this.usersService.update(user.id, {
            passwordHash,
            resetPasswordToken: null,
            resetPasswordExpires: null,
        });

        return { message: 'Password has been successfully reset.' };
    }
}
