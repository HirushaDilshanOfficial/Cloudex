import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { EmailService } from './email.service';

@Controller('notifications')
export class NotificationsController {
    constructor(private readonly emailService: EmailService) { }

    @Post('receipt')
    async sendReceipt(@Body() body: { email: string; order: any }) {
        if (!body.email || !body.order) {
            throw new BadRequestException('Email and Order data are required');
        }

        try {
            return await this.emailService.sendReceipt(body.email, body.order);
        } catch (error: any) {
            console.error('Email sending failed:', error);
            if (error.responseCode === 535 || error.code === 'EAUTH') {
                throw new BadRequestException('Email login failed. Please check your SMTP credentials in .env');
            }
            throw new BadRequestException('Failed to send email: ' + (error.message || 'Unknown error'));
        }
    }
}
