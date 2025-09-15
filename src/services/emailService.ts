import nodemailer from 'nodemailer';

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

class EmailService {
  private transporter: nodemailer.Transporter;
  private fromEmail: string;

  constructor() {
    const config: EmailConfig = {
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER || '',
        pass: process.env.EMAIL_PASS || ''
      }
    };

    // Debug logging
    console.log('📧 Email configuration:', {
      host: config.host,
      port: config.port,
      user: config.auth.user,
      hasPassword: !!config.auth.pass
    });

    this.fromEmail = process.env.EMAIL_FROM || 'noreply@edotalenthunt.com';
    this.transporter = nodemailer.createTransport(config);
  }

  async sendOTPEmail(email: string, otp: string, type: 'verification' | 'password_reset'): Promise<void> {
    try {
      const subject = type === 'verification' 
        ? 'Verify Your Email - Edo Talent Hunt'
        : 'Reset Your Password - Edo Talent Hunt';

      const htmlContent = this.generateOTPEmailTemplate(otp, type);

      const mailOptions = {
        from: `"Edo Talent Hunt" <${this.fromEmail}>`,
        to: email,
        subject,
        html: htmlContent
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`✅ OTP email sent successfully to ${email}`);
    } catch (error) {
      console.error('❌ Failed to send OTP email:', error);
      throw new Error('Failed to send OTP email');
    }
  }

  private generateOTPEmailTemplate(otp: string, type: 'verification' | 'password_reset'): string {
    const title = type === 'verification' ? 'Verify Your Email' : 'Reset Your Password';
    const message = type === 'verification' 
      ? 'Thank you for registering with Edo Talent Hunt! Please use the OTP below to verify your email address.'
      : 'You requested to reset your password. Please use the OTP below to proceed with password reset.';

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <style>
          body {
            font-family: 'Arial', sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
          }
          .container {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            font-size: 24px;
            font-weight: bold;
            color: #DAA520;
            margin-bottom: 10px;
          }
          .otp-container {
            background: #f8f9fa;
            border: 2px dashed #DAA520;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            margin: 20px 0;
          }
          .otp {
            font-size: 32px;
            font-weight: bold;
            color: #DAA520;
            letter-spacing: 8px;
            margin: 10px 0;
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            font-size: 12px;
            color: #666;
            text-align: center;
          }
          .warning {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            color: #856404;
            padding: 10px;
            border-radius: 5px;
            margin: 15px 0;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🎤 EDO TALENT HUNT</div>
            <h1>${title}</h1>
          </div>
          
          <p>Hello,</p>
          <p>${message}</p>
          
          <div class="otp-container">
            <p><strong>Your OTP Code:</strong></p>
            <div class="otp">${otp}</div>
            <p><small>This code will expire in 10 minutes</small></p>
          </div>
          
          <div class="warning">
            <strong>Security Notice:</strong> Never share this OTP with anyone. Our team will never ask for your OTP via phone or email.
          </div>
          
          <p>If you didn't request this ${type === 'verification' ? 'verification' : 'password reset'}, please ignore this email.</p>
          
          <div class="footer">
            <p>© 2025 Edo Talent Hunt. All rights reserved.</p>
            <p>This is an automated email, please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      console.log('✅ Email service connection verified');
      return true;
    } catch (error) {
      console.error('❌ Email service connection failed:', error);
      return false;
    }
  }
}

export default new EmailService();
