import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
    private transporter;

    constructor(private configService: ConfigService) {
        // Using Ethereal for development (fake SMTP service)
        // In production, replace with SendGrid, AWS SES, or Gmail
        this.createTransporter();
    }

    private async createTransporter() {
        try {
            const host = this.configService.get<string>('SMTP_HOST');
            const port = this.configService.get<number>('SMTP_PORT');
            const user = this.configService.get<string>('SMTP_USER');
            const pass = this.configService.get<string>('SMTP_PASS');

            if (host && port && user && pass) {
                console.log(`Configuring SMTP with Host: ${host}, Port: ${port}, User: ${user}`);
                this.transporter = nodemailer.createTransport({
                    host,
                    port,
                    secure: port === 465, // true for 465, false for other ports
                    auth: {
                        user,
                        pass,
                    },
                });
                console.log('Email transporter created with SMTP configuration');
            } else {
                console.log('SMTP configuration missing or incomplete. Falling back to Ethereal.');
                console.log(`Missing vars - Host: ${!host}, Port: ${!port}, User: ${!user}, Pass: ${!pass}`);
                // Generate test SMTP service account from ethereal.email
                const testAccount = await nodemailer.createTestAccount();

                this.transporter = nodemailer.createTransport({
                    host: 'smtp.ethereal.email',
                    port: 587,
                    secure: false,
                    auth: {
                        user: testAccount.user,
                        pass: testAccount.pass,
                    },
                });
                console.log('Email transporter created with test account:', testAccount.user);
                console.log('WARNING: Using Ethereal Email (fake). Emails will not be delivered to real addresses.');
            }
        } catch (error) {
            console.error('Failed to create email transporter', error);
        }
    }

    async sendReceipt(email: string, order: any) {
        try {
            console.log(`Attempting to send receipt to ${email} for order ${order.id}`);

            if (!this.transporter) {
                await this.createTransporter();
            }

            const info = await this.transporter.sendMail({
                from: '"My Restaurant" <pos@example.com>', // sender address
                to: email, // list of receivers
                subject: `Receipt for Order #${order.orderNumber || order.id}`, // Subject line
                html: this.generateReceiptHtml(order), // html body
            });

            console.log('Message sent: %s', info.messageId);
            console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
            return info;
        } catch (error) {
            console.error('Error sending email:', error);
            throw error;
        }
    }

    private generateReceiptHtml(order: any): string {
        const items = Array.isArray(order.items) ? order.items : [];
        const itemsHtml = items.map((item: any) => `
            <tr>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.quantity}x ${item.name || 'Item'}</td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">$${(Number(item.price) * Number(item.quantity)).toFixed(2)}</td>
            </tr>
        `).join('');

        return `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <h1 style="color: #333; margin: 0;">My Restaurant</h1>
                    <p style="color: #666; margin: 5px 0;">Thank you for your order!</p>
                </div>
                
                <div style="margin-bottom: 20px; background: #f9f9f9; padding: 15px; border-radius: 5px;">
                    <p style="margin: 5px 0;"><strong>Order #:</strong> ${order.orderNumber || order.id}</p>
                    <p style="margin: 5px 0;"><strong>Date:</strong> ${new Date().toLocaleString()}</p>
                    <p style="margin: 5px 0;"><strong>Payment Method:</strong> ${order.paymentMethod || 'CASH'}</p>
                </div>

                <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                    <thead>
                        <tr style="background: #eee;">
                            <th style="padding: 10px; text-align: left;">Item</th>
                            <th style="padding: 10px; text-align: right;">Price</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsHtml}
                    </tbody>
                </table>

                <div style="text-align: right; margin-top: 20px;">
                    <p style="margin: 5px 0;">Subtotal: <strong>$${(Number(order.totalAmount) / 1.1).toFixed(2)}</strong></p>
                    <p style="margin: 5px 0;">Tax (10%): <strong>$${(Number(order.totalAmount) - (Number(order.totalAmount) / 1.1)).toFixed(2)}</strong></p>
                    <h2 style="margin: 10px 0; color: #333;">Total: $${Number(order.totalAmount).toFixed(2)}</h2>
                </div>

                <div style="text-align: center; margin-top: 30px; color: #999; font-size: 12px;">
                    <p>123 Food Street, Tasty City</p>
                    <p>This is an automated receipt.</p>
                </div>
            </div>
        `;
    }
}
