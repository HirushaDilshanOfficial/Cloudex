import { Controller, Request, Post, UseGuards, Body, UnauthorizedException, Param } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from '../common/decorators/public.decorator';
import { SignUpDto } from './dto/sign-up.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @Public()
    @Post('login')
    async login(@Body() loginDto: any) {
        try {
            console.log('Login attempt for:', loginDto.email);
            const user = await this.authService.validateUser(loginDto.email, loginDto.password);
            if (!user) {
                console.log('Invalid credentials for:', loginDto.email);
                throw new UnauthorizedException('Invalid credentials');
            }
            return this.authService.login(user);
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    }

    @Public()
    @Post('register')
    async register(@Body() registerDto: any) {
        return this.authService.register(registerDto);
    }

    @Public()
    @Post('signup')
    async signUp(@Body() signUpDto: SignUpDto) {
        return this.authService.signUp(signUpDto);
    }

    @Public()
    @Post('forgot-password')
    async forgotPassword(@Body() body: { email: string }) {
        return this.authService.forgotPassword(body.email);
    }

    @Public()
    @Post('reset-password')
    async resetPassword(@Body() body: { token: string; password: string }) {
        return this.authService.resetPassword(body.token, body.password);
    }

    @Post('impersonate/:tenantId')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.SUPER_ADMIN)
    async impersonate(@Param('tenantId') tenantId: string) {
        return this.authService.impersonateTenant(tenantId);
    }
}
