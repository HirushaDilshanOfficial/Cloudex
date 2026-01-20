import { Controller, Post, Body } from '@nestjs/common';
import { EmailService } from '../notifications/email.service';

@Controller('contact')
export class ContactController {
    constructor(private readonly emailService: EmailService) { }

    @Post()
    async submitContactForm(@Body() body: { firstName: string; lastName: string; email: string; message: string }) {
        return this.emailService.sendContactEmail(body);
    }
}
