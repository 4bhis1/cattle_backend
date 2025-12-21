import nodemailer from 'nodemailer';
import features from '../config/features';
import logger from '../config/logger';

interface EmailOptions {
    email: string;
    subject: string;
    message: string;
}

export class EmailService {
    private transporter: nodemailer.Transporter;

    constructor() {
        if (features.email.enabled) {
            this.transporter = nodemailer.createTransport({
                service: 'gmail', // Default, customize via .env or config
                auth: {
                    user: process.env.EMAIL_USERNAME,
                    pass: process.env.EMAIL_PASSWORD
                }
            });
        } else {
            // Mock transporter
            this.transporter = {
                sendMail: async (mailOptions: any) => {
                    logger.info('Email service disabled. Mock email sent:', mailOptions);
                }
            } as any;
        }
    }

    async sendEmail(options: EmailOptions) {
        const mailOptions = {
            from: `Pookie Coder <${process.env.EMAIL_FROM}>`,
            to: options.email,
            subject: options.subject,
            text: options.message,
            // html: options.html
        };

        await this.transporter.sendMail(mailOptions);
    }
}
