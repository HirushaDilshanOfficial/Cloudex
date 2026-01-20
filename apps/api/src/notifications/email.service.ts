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
    async sendPasswordResetEmail(email: string, token: string) {
        try {
            console.log(`Attempting to send password reset email to ${email}`);

            if (!this.transporter) {
                await this.createTransporter();
            }

            const resetLink = `http://localhost:3000/reset-password?token=${token}`;

            const info = await this.transporter.sendMail({
                from: '"Cloudex Support" <support@cloudex.com>',
                to: email,
                subject: 'Reset Your Password',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                        <div style="text-align: center; margin-bottom: 20px;">
                            <h1 style="color: #333; margin: 0;">Cloudex</h1>
                        </div>
                        
                        <div style="margin-bottom: 20px; padding: 15px;">
                            <p>Hello,</p>
                            <p>You requested a password reset for your Cloudex account.</p>
                            <p>Please click the button below to reset your password. This link will expire in 1 hour.</p>
                            
                            <div style="text-align: center; margin: 30px 0;">
                                <a href="${resetLink}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
                            </div>

                            <p>If you didn't ask to reset your password, you can ignore this email.</p>
                        </div>

                        <div style="text-align: center; margin-top: 30px; color: #999; font-size: 12px;">
                            <p>© 2026 Cloudex Inc. All rights reserved.</p>
                        </div>
                    </div>
                `,
            });

            console.log('Password reset email sent: %s', info.messageId);
            console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
            return info;
        } catch (error) {
            console.error('Error sending password reset email:', error);
            throw error;
        }
    }
    async sendLowStockAlert(email: string, alert: any) {
        try {
            console.log(`Attempting to send low stock alert to ${email}`);

            if (!this.transporter) {
                await this.createTransporter();
            }

            const info = await this.transporter.sendMail({
                from: '"Cloudex Inventory" <inventory@cloudex.com>',
                to: email,
                subject: `Low Stock Alert: ${alert.ingredient?.name}`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                        <div style="text-align: center; margin-bottom: 20px;">
                            <h1 style="color: #d9534f; margin: 0;">Low Stock Alert</h1>
                        </div>
                        
                        <div style="margin-bottom: 20px; padding: 15px; background-color: #fff3f3; border-left: 4px solid #d9534f;">
                            <p><strong>Item:</strong> ${alert.ingredient?.name}</p>
                            <p><strong>Current Stock:</strong> ${alert.ingredient?.currentStock} ${alert.ingredient?.unit}</p>
                            <p><strong>Threshold:</strong> ${alert.threshold} ${alert.ingredient?.unit}</p>
                            <p><strong>Branch:</strong> ${alert.branch?.name || 'All Branches'}</p>
                            ${alert.notes ? `<p><strong>Notes:</strong> ${alert.notes}</p>` : ''}
                        </div>

                        <div style="text-align: center; margin: 30px 0;">
                            <a href="http://localhost:3000/dashboard/inventory" style="background-color: #d9534f; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">View Inventory</a>
                        </div>

                        <div style="text-align: center; margin-top: 30px; color: #999; font-size: 12px;">
                            <p>This is an automated alert from Cloudex.</p>
                        </div>
                    </div>
                `,
            });

            console.log('Low stock alert sent: %s', info.messageId);
            return info;
        } catch (error) {
            console.error('Error sending low stock alert:', error);
            // Don't throw error to prevent blocking the main flow
        }
    }

    async sendContactEmail(data: { firstName: string; lastName: string; email: string; message: string }) {
        try {
            console.log(`Attempting to send contact form email from ${data.email}`);

            if (!this.transporter) {
                await this.createTransporter();
            }

            const info = await this.transporter.sendMail({
                from: '"Cloudex Contact Form" <noreply@cloudex.com>',
                to: 'hirushadilshan255@gmail.com',
                replyTo: data.email,
                subject: `New Contact Message from ${data.firstName} ${data.lastName}`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                        <div style="margin-bottom: 20px; border-bottom: 1px solid #eee; padding-bottom: 10px;">
                            <h2 style="color: #333; margin: 0;">New Contact Message</h2>
                        </div>
                        
                        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
                            <p><strong>Name:</strong> ${data.firstName} ${data.lastName}</p>
                            <p><strong>Email:</strong> ${data.email}</p>
                            <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
                        </div>

                        <div style="padding: 15px; border: 1px solid #eee; border-radius: 5px;">
                            <p style="margin-top: 0; color: #555;"><strong>Message:</strong></p>
                            <p style="white-space: pre-wrap; color: #333;">${data.message}</p>
                        </div>
                    </div>
                `,
            });

            console.log('Contact email sent: %s', info.messageId);
            return info;
        } catch (error) {
            console.error('Error sending contact email:', error);
            throw error;
        }
    }
}
