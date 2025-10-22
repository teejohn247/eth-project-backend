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
      host: process.env.EMAIL_HOST || 'smtp-relay.brevo.com',
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER || '99c77c001@smtp-brevo.com',
        pass: process.env.BREVO_SMTP_KEY || process.env.EMAIL_PASS || ''
      }
    };

    // Debug logging
    console.log('📧 Email configuration:', {
      host: config.host,
      port: config.port,
      user: config.auth.user,
      hasPassword: !!config.auth.pass
    });

    this.fromEmail = process.env.EMAIL_FROM || 'edotalenthunt@themakersacad.com';
    this.transporter = nodemailer.createTransport(config);
  }
  

  async sendOTPEmail(email: string, otp: string, type: 'verification' | 'password_reset'): Promise<void> {
    try {
      const subject = type === 'verification' 
        ? 'Verify Your Email - Edo Talent Hunt'
        : 'Reset Your Password - Edo Talent Hunt';

      const htmlContent = this.generateOTPEmailTemplate(email, otp, type);

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

  async sendBulkParticipantInvitation(email: string, otp: string, firstName: string, bulkRegistrationNumber: string): Promise<void> {
    try {
      const subject = 'You\'re Invited to Join Edo Talent Hunt!';
      const htmlContent = this.generateBulkInvitationTemplate(email, otp, firstName, bulkRegistrationNumber);

      const mailOptions = {
        from: `"Edo Talent Hunt" <${this.fromEmail}>`,
        to: email,
        subject,
        html: htmlContent
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`✅ Bulk invitation email sent successfully to ${email}`);
    } catch (error) {
      console.error('❌ Failed to send bulk invitation email:', error);
      throw new Error('Failed to send bulk invitation email');
    }
  }

  private generateOTPEmailTemplate(email: string, otp: string, type: 'verification' | 'password_reset'): string {
    const title = type === 'verification' ? 'Verify Your Email Address' : 'Reset Your Password';
    const message = type === 'verification' 
      ? 'Welcome to Edo Talent Hunt! We\'re excited to have you join our community of talented individuals. Please verify your email address to complete your registration.'
      : 'We received a request to reset your password for your Edo Talent Hunt account. Please use the verification code below to proceed.';

    const actionText = type === 'verification' 
      ? 'Complete Email Verification'
      : 'Reset Your Password';

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #333333;
            background: linear-gradient(135deg, #F5F5DC 0%, #FFF8DC 50%, #FFFACD 100%);
            margin: 0;
            padding: 20px;
          }
          
          .email-wrapper {
            max-width: 600px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 24px;
            overflow: hidden;
            box-shadow: 0 25px 50px rgba(218, 165, 32, 0.2);
            border: 2px solid rgba(255, 215, 0, 0.3);
          }
          
          .header {
            background: linear-gradient(135deg, #FFD700 0%, #F4D03F 30%, #DAA520 70%, #B8860B 100%);
            padding: 60px 40px;
            text-align: center;
            position: relative;
            overflow: hidden;
          }
          
          .header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: radial-gradient(circle at 30% 20%, rgba(255, 255, 255, 0.4) 0%, transparent 50%),
                        radial-gradient(circle at 70% 80%, rgba(255, 255, 255, 0.3) 0%, transparent 50%);
            pointer-events: none;
          }
          
          .circular-frame {
            width: 160px;
            height: 160px;
            margin: 0 auto 30px;
            background: #ffffff;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 
              0 0 0 8px rgba(255, 255, 255, 0.8),
              0 0 0 16px rgba(255, 215, 0, 0.6),
              0 15px 35px rgba(0, 0, 0, 0.2),
              inset 0 5px 20px rgba(255, 215, 0, 0.3);
            position: relative;
            z-index: 2;
          }
          
          .circular-frame::before {
            content: '';
            position: absolute;
            top: -4px;
            left: -4px;
            right: -4px;
            bottom: -4px;
            background: linear-gradient(45deg, #FFD700, #F4D03F, #DAA520, #B8860B);
            border-radius: 50%;
            z-index: -1;
            animation: rotate 10s linear infinite;
          }
          
          @keyframes rotate {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          .logo {
            width: 120px;
            height: 120px;
            border-radius: 50%;
            overflow: hidden;
            background: #ffffff;
          }
          
          .logo img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            border-radius: 50%;
          }
          
          .brand-text {
            position: relative;
            z-index: 2;
          }
          
          .brand-name {
            font-size: 36px;
            font-weight: 900;
            color: #1a1a1a;
            text-shadow: 2px 2px 8px rgba(0, 0, 0, 0.3);
            letter-spacing: 3px;
            margin: 0 0 10px 0;
            text-transform: uppercase;
          }
          
          .brand-tagline {
            font-size: 16px;
            color: rgba(26, 26, 26, 0.8);
            font-weight: 600;
            letter-spacing: 2px;
            text-transform: uppercase;
            margin: 0;
          }
          
          .content {
            padding: 50px 40px;
            background: #ffffff;
            text-align: center;
          }
          
          .greeting {
            font-size: 24px;
            font-weight: 600;
            color: #2D3748;
            margin-bottom: 20px;
          }
          
          .message {
            font-size: 16px;
            color: #4A5568;
            line-height: 1.7;
            margin-bottom: 40px;
            max-width: 480px;
            margin-left: auto;
            margin-right: auto;
          }
          
          .verification-card {
            background: linear-gradient(135deg, #FFF9E6 0%, #FFF5CC 100%);
            border: 3px solid #FFD700;
            border-radius: 20px;
            padding: 40px 30px;
            margin: 40px 0;
            position: relative;
            overflow: hidden;
          }
          
          .verification-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 6px;
            background: linear-gradient(90deg, #FFD700, #F4D03F, #DAA520, #B8860B);
          }
          
          .verification-title {
            font-size: 18px;
            color: #B8860B;
            font-weight: 700;
            margin-bottom: 25px;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          
          .otp-display {
            background: #ffffff;
            border: 3px dashed #DAA520;
            border-radius: 16px;
            padding: 30px 20px;
            margin: 25px 0;
            box-shadow: 0 8px 25px rgba(218, 165, 32, 0.2);
          }
          
          .otp-code {
            font-size: 48px;
            font-weight: 900;
            color: #B8860B;
            letter-spacing: 8px;
            font-family: 'Courier New', monospace;
            text-shadow: 2px 2px 4px rgba(184, 134, 11, 0.3);
            margin: 0;
          }
          
          .otp-timer {
            font-size: 14px;
            color: #8B7355;
            margin-top: 20px;
            font-weight: 600;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
          }
          
          .security-alert {
            background: linear-gradient(135deg, #FFF5F5 0%, #FED7D7 100%);
            border: 2px solid #F56565;
            border-radius: 16px;
            padding: 25px;
            margin: 35px 0;
            display: flex;
            align-items: flex-start;
            gap: 15px;
            text-align: left;
          }
          
          .security-icon {
            color: #E53E3E;
            font-size: 24px;
            margin-top: 2px;
            min-width: 24px;
          }
          
          .security-content {
            flex: 1;
          }
          
          .security-title {
            font-size: 16px;
            font-weight: 700;
            color: #742A2A;
            margin-bottom: 8px;
          }
          
          .security-text {
            font-size: 14px;
            color: #742A2A;
            line-height: 1.6;
          }
          
          .help-section {
            background: #F7FAFC;
            border-radius: 12px;
            padding: 25px;
            margin: 35px 0;
            text-align: center;
          }
          
          .help-text {
            font-size: 15px;
            color: #4A5568;
            line-height: 1.6;
            margin: 0;
          }
          
          .footer {
            background: linear-gradient(135deg, #F7FAFC 0%, #EDF2F7 100%);
            padding: 40px;
            text-align: center;
            border-top: 3px solid #E2E8F0;
          }
          
          .footer-logo {
            width: 50px;
            height: 50px;
            margin: 0 auto 25px;
            opacity: 0.7;
            border-radius: 50%;
            background: linear-gradient(135deg, #FFD700, #DAA520);
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          .footer-content {
            max-width: 400px;
            margin: 0 auto;
          }
          
          .footer-title {
            font-size: 18px;
            font-weight: 700;
            color: #2D3748;
            margin-bottom: 8px;
          }
          
          .footer-subtitle {
            font-size: 14px;
            color: #718096;
            margin-bottom: 20px;
            font-style: italic;
          }
          
          .footer-text {
            font-size: 13px;
            color: #718096;
            line-height: 1.5;
            margin-bottom: 20px;
          }
          
          .social-links {
            display: flex;
            justify-content: center;
            gap: 20px;
            margin-top: 25px;
          }
          
          .social-link {
            color: #DAA520;
            text-decoration: none;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 1px;
            padding: 8px 16px;
            border: 2px solid #DAA520;
            border-radius: 20px;
            transition: all 0.3s ease;
          }
          
          .social-link:hover {
            background: #DAA520;
            color: #ffffff;
          }
          
          @media (max-width: 600px) {
            body {
              padding: 10px;
            }
            
            .email-wrapper {
              border-radius: 16px;
            }
            
            .header {
              padding: 40px 20px;
            }
            
            .circular-frame {
              width: 120px;
              height: 120px;
            }
            
            .logo {
              width: 90px;
              height: 90px;
            }
            
            .brand-name {
              font-size: 24px;
              letter-spacing: 2px;
            }
            
            .brand-tagline {
              font-size: 12px;
            }
            
            .content {
              padding: 30px 20px;
            }
            
            .greeting {
              font-size: 20px;
            }
            
            .verification-card {
              padding: 30px 20px;
            }
            
            .otp-code {
              font-size: 36px;
              letter-spacing: 6px;
            }
            
            .footer {
              padding: 30px 20px;
            }
            
            .social-links {
              flex-direction: column;
              align-items: center;
              gap: 10px;
            }
          }
        </style>
      </head>
      <body>
        <div class="email-wrapper">
          <div class="header">
            <div class="circular-frame">
              <div class="logo">
                <img src="https://www.edotalenthunt.com/assets/img/project/eth-logo-wht.png" alt="Edo Talent Hunt Logo" />
              </div>
            </div>
            <div class="brand-text">
              <h1 class="brand-name">Edo Talent Hunt</h1>
              <p class="brand-tagline">Discover • Nurture • Celebrate</p>
            </div>
          </div>
          
          <div class="content">
            <h2 class="greeting">Hello!</h2>
            
            <p class="message">${message}</p>
            
            <div class="verification-card">
              <h3 class="verification-title">${actionText}</h3>
              <div class="otp-display">
                <div class="otp-code">${otp}</div>
                <div class="otp-timer">
                  <span>⏰</span>
                  <span>This code expires in 10 minutes</span>
                </div>
              </div>
            </div>
            
            <div class="security-alert">
              <div class="security-icon">🔒</div>
              <div class="security-content">
                <div class="security-title">Security Notice</div>
                <div class="security-text">
                  This verification code is confidential and should never be shared with anyone. Our team will never ask for your verification code via phone, email, or any other means. If you didn't request this code, please ignore this email and consider changing your account password.
                </div>
              </div>
            </div>
            
            <div class="help-section">
              <p class="help-text">
                ${type === 'verification' 
                  ? 'Having trouble? Make sure to check your spam folder. If you continue having issues, please contact our support team.'
                  : 'If you didn\'t request a password reset, please ignore this email. Your account remains secure and no changes have been made.'}
              </p>
            </div>
          </div>
          
          <div class="footer">
            <div class="footer-logo">
              <svg width="30" height="30" viewBox="0 0 30 30" fill="white">
                <circle cx="15" cy="15" r="12" fill="none" stroke="white" stroke-width="2"/>
                <path d="M10 12 L20 12 L21 8 L9 8 Z" fill="white"/>
                <rect x="14" y="14" width="2" height="8" fill="white"/>
                <rect x="12" y="22" width="6" height="1" fill="white"/>
              </svg>
            </div>
            
            <div class="footer-content">
              <div class="footer-title">Edo Talent Hunt</div>
              <div class="footer-subtitle">Empowering talents across Edo State and beyond</div>
              
              <div class="footer-text">
                © 2024 Edo Talent Hunt. All rights reserved.<br>
                This is an automated message, please do not reply directly to this email.
              </div>
              
              <div class="social-links">
                <a href="#" class="social-link">Website</a>
                <a href="#" class="social-link">Instagram</a>
                <a href="#" class="social-link">Twitter</a>
                <a href="#" class="social-link">Facebook</a>
              </div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generateBulkInvitationTemplate(email: string, otp: string, firstName: string, bulkRegistrationNumber: string): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>You're Invited to Join Edo Talent Hunt!</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #333333;
            background: linear-gradient(135deg, #F5F5DC 0%, #FFF8DC 50%, #FFFACD 100%);
            margin: 0;
            padding: 20px;
          }
          
          .email-wrapper {
            max-width: 600px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 24px;
            overflow: hidden;
            box-shadow: 0 25px 50px rgba(218, 165, 32, 0.2);
            border: 2px solid rgba(255, 215, 0, 0.3);
          }
          
          .header {
            background: linear-gradient(135deg, #FFD700 0%, #F4D03F 30%, #DAA520 70%, #B8860B 100%);
            padding: 60px 40px;
            text-align: center;
            position: relative;
            overflow: hidden;
          }
          
          .header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: radial-gradient(circle at 30% 20%, rgba(255, 255, 255, 0.4) 0%, transparent 50%),
                        radial-gradient(circle at 70% 80%, rgba(255, 255, 255, 0.3) 0%, transparent 50%);
            pointer-events: none;
          }
          
          .circular-frame {
            width: 160px;
            height: 160px;
            margin: 0 auto 30px;
            background: #ffffff;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 
              0 0 0 8px rgba(255, 255, 255, 0.8),
              0 0 0 16px rgba(255, 215, 0, 0.6),
              0 15px 35px rgba(0, 0, 0, 0.2),
              inset 0 5px 20px rgba(255, 215, 0, 0.3);
            position: relative;
            z-index: 2;
          }
          
          .logo {
            width: 120px;
            height: 120px;
            border-radius: 50%;
            overflow: hidden;
            background: #ffffff;
          }
          
          .logo img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            border-radius: 50%;
          }
          
          .brand-text {
            position: relative;
            z-index: 2;
          }
          
          .brand-name {
            font-size: 36px;
            font-weight: 900;
            color: #1a1a1a;
            text-shadow: 2px 2px 8px rgba(0, 0, 0, 0.3);
            letter-spacing: 3px;
            margin: 0 0 10px 0;
            text-transform: uppercase;
          }
          
          .brand-tagline {
            font-size: 16px;
            color: rgba(26, 26, 26, 0.8);
            font-weight: 600;
            letter-spacing: 2px;
            text-transform: uppercase;
            margin: 0;
          }
          
          .content {
            padding: 50px 40px;
            background: #ffffff;
            text-align: center;
          }
          
          .invitation-badge {
            background: linear-gradient(135deg, #FFD700, #DAA520);
            color: #1a1a1a;
            padding: 12px 24px;
            border-radius: 25px;
            font-size: 14px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1px;
            display: inline-block;
            margin-bottom: 30px;
            box-shadow: 0 4px 15px rgba(218, 165, 32, 0.3);
          }
          
          .greeting {
            font-size: 28px;
            font-weight: 700;
            color: #2D3748;
            margin-bottom: 20px;
          }
          
          .message {
            font-size: 16px;
            color: #4A5568;
            line-height: 1.7;
            margin-bottom: 40px;
            max-width: 480px;
            margin-left: auto;
            margin-right: auto;
          }
          
          .bulk-info {
            background: linear-gradient(135deg, #FFF9E6 0%, #FFF5CC 100%);
            border: 2px solid #FFD700;
            border-radius: 16px;
            padding: 25px;
            margin: 30px 0;
            text-align: left;
          }
          
          .bulk-info h4 {
            color: #B8860B;
            font-size: 16px;
            font-weight: 700;
            margin-bottom: 15px;
            text-transform: uppercase;
          }
          
          .bulk-info p {
            color: #4A5568;
            font-size: 14px;
            margin-bottom: 8px;
          }
          
          .verification-card {
            background: linear-gradient(135deg, #FFF9E6 0%, #FFF5CC 100%);
            border: 3px solid #FFD700;
            border-radius: 20px;
            padding: 40px 30px;
            margin: 40px 0;
            position: relative;
            overflow: hidden;
          }
          
          .verification-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 6px;
            background: linear-gradient(90deg, #FFD700, #F4D03F, #DAA520, #B8860B);
          }
          
          .verification-title {
            font-size: 18px;
            color: #B8860B;
            font-weight: 700;
            margin-bottom: 25px;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          
          .otp-display {
            background: #ffffff;
            border: 3px dashed #DAA520;
            border-radius: 16px;
            padding: 30px 20px;
            margin: 25px 0;
            box-shadow: 0 8px 25px rgba(218, 165, 32, 0.2);
          }
          
          .otp-code {
            font-size: 48px;
            font-weight: 900;
            color: #B8860B;
            letter-spacing: 8px;
            font-family: 'Courier New', monospace;
            text-shadow: 2px 2px 4px rgba(184, 134, 11, 0.3);
            margin: 0;
          }
          
          .otp-timer {
            font-size: 14px;
            color: #8B7355;
            margin-top: 20px;
            font-weight: 600;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
          }
          
               .verification-link-section {
                 background: linear-gradient(135deg, #FFF9E6 0%, #FFF5CC 100%);
                 border: 3px solid #FFD700;
                 border-radius: 20px;
                 padding: 40px 30px;
                 margin: 40px 0;
                 text-align: center;
                 position: relative;
                 overflow: hidden;
               }
               
               .verification-link-section::before {
                 content: '';
                 position: absolute;
                 top: 0;
                 left: 0;
                 right: 0;
                 height: 6px;
                 background: linear-gradient(90deg, #FFD700, #F4D03F, #DAA520, #B8860B);
               }
               
               .verification-link-title {
                 font-size: 20px;
                 color: #B8860B;
                 font-weight: 700;
                 margin-bottom: 15px;
                 text-transform: uppercase;
                 letter-spacing: 1px;
               }
               
               .verification-link-text {
                 font-size: 16px;
                 color: #4A5568;
                 line-height: 1.6;
                 margin-bottom: 25px;
               }
               
               .verification-button-container {
                 margin: 30px 0;
               }
               
               .verification-button {
                 display: inline-block;
                 background: linear-gradient(135deg, #FFD700 0%, #F4D03F 30%, #DAA520 70%, #B8860B 100%);
                 color: #1a1a1a;
                 text-decoration: none;
                 padding: 18px 40px;
                 border-radius: 50px;
                 font-size: 16px;
                 font-weight: 700;
                 text-transform: uppercase;
                 letter-spacing: 1px;
                 box-shadow: 0 8px 25px rgba(218, 165, 32, 0.4);
                 transition: all 0.3s ease;
                 border: 3px solid rgba(255, 255, 255, 0.8);
               }
               
               .verification-button:hover {
                 transform: translateY(-2px);
                 box-shadow: 0 12px 35px rgba(218, 165, 32, 0.6);
                 background: linear-gradient(135deg, #F4D03F 0%, #FFD700 30%, #B8860B 70%, #DAA520 100%);
               }
               
               .verification-note {
                 font-size: 14px;
                 color: #8B7355;
                 font-style: italic;
                 margin-top: 20px;
               }
               
               .steps-section {
                 background: #F7FAFC;
                 border-radius: 16px;
                 padding: 30px;
                 margin: 35px 0;
                 text-align: left;
               }
          
          .steps-title {
            font-size: 18px;
            font-weight: 700;
            color: #2D3748;
            margin-bottom: 20px;
            text-align: center;
          }
          
          .step {
            display: flex;
            align-items: flex-start;
            margin-bottom: 15px;
          }
          
          .step-number {
            background: #DAA520;
            color: white;
            width: 24px;
            height: 24px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: 700;
            margin-right: 15px;
            flex-shrink: 0;
          }
          
          .step-text {
            color: #4A5568;
            font-size: 14px;
            line-height: 1.5;
          }
          
          .footer {
            background: linear-gradient(135deg, #F7FAFC 0%, #EDF2F7 100%);
            padding: 40px;
            text-align: center;
            border-top: 3px solid #E2E8F0;
          }
          
          .footer-logo {
            width: 50px;
            height: 50px;
            margin: 0 auto 25px;
            opacity: 0.7;
            border-radius: 50%;
            background: linear-gradient(135deg, #FFD700, #DAA520);
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          .footer-content {
            max-width: 400px;
            margin: 0 auto;
          }
          
          .footer-title {
            font-size: 18px;
            font-weight: 700;
            color: #2D3748;
            margin-bottom: 8px;
          }
          
          .footer-subtitle {
            font-size: 14px;
            color: #718096;
            margin-bottom: 20px;
            font-style: italic;
          }
          
          .footer-text {
            font-size: 13px;
            color: #718096;
            line-height: 1.5;
            margin-bottom: 20px;
          }
          
          @media (max-width: 600px) {
            body {
              padding: 10px;
            }
            
            .email-wrapper {
              border-radius: 16px;
            }
            
            .header {
              padding: 40px 20px;
            }
            
            .circular-frame {
              width: 120px;
              height: 120px;
            }
            
            .logo {
              width: 90px;
              height: 90px;
            }
            
            .brand-name {
              font-size: 24px;
              letter-spacing: 2px;
            }
            
            .content {
              padding: 30px 20px;
            }
            
            .greeting {
              font-size: 24px;
            }
            
            .verification-card {
              padding: 30px 20px;
            }
            
            .otp-code {
              font-size: 36px;
              letter-spacing: 6px;
            }
            
            .footer {
              padding: 30px 20px;
            }
          }
        </style>
      </head>
      <body>
        <div class="email-wrapper">
          <div class="header">
            <div class="circular-frame">
              <div class="logo">
                <img src="https://www.edotalenthunt.com/assets/img/project/eth-logo-wht.png" alt="Edo Talent Hunt Logo" />
              </div>
            </div>
            <div class="brand-text">
              <h1 class="brand-name">Edo Talent Hunt</h1>
              <p class="brand-tagline">Discover • Nurture • Celebrate</p>
            </div>
          </div>
          
          <div class="content">
            <div class="invitation-badge">🎉 BULK REGISTRATION INVITATION</div>
            
            <h2 class="greeting">Hello ${firstName}!</h2>
            
            <p class="message">
              Great news! You've been invited to participate in Edo Talent Hunt through a bulk registration. 
              Your registration slot has already been paid for, so you can proceed directly to complete your profile and registration.
            </p>
            
            <div class="bulk-info">
              <h4>📋 Registration Details</h4>
              <p><strong>Bulk Registration Number:</strong> ${bulkRegistrationNumber}</p>
              <p><strong>Registration Status:</strong> Slot Paid & Reserved</p>
              <p><strong>Next Step:</strong> Verify email and complete registration</p>
            </div>
            
            <div class="verification-card">
              <h3 class="verification-title">Verify Your Email Address</h3>
              <div class="otp-display">
                <div class="otp-code">${otp}</div>
                <div class="otp-timer">
                  <span>⏰</span>
                  <span>This code expires in 10 minutes</span>
                </div>
              </div>
            </div>
            
                 <div class="verification-link-section">
                   <h3 class="verification-link-title">🌐 Ready to Get Started?</h3>
                   <p class="verification-link-text">
                     Click the button below to begin your verification process and complete your registration:
                   </p>
                   
                   <div class="verification-button-container">
                     <a href="https://edotalenthunt.com/verify?email=${email}" class="verification-button" target="_blank">
                       Verify Email & Complete Registration
                     </a>
                   </div>
                   
                   <p class="verification-note">
                     <strong>Note:</strong> You'll need the OTP code above when you visit the verification page.
                   </p>
                 </div>
                 
                 <div class="steps-section">
                   <h3 class="steps-title">🚀 Next Steps to Complete Your Registration</h3>
                   
                   <div class="step">
                     <div class="step-number">1</div>
                     <div class="step-text">
                       <strong>Visit Verification Page:</strong> Click the button above or go to <a href="https://edotalenthunt.com/verify?email=${email}" target="_blank" style="color: #DAA520; text-decoration: none;">https://edotalenthunt.com/verify</a>
                     </div>
                   </div>
                   
                   <div class="step">
                     <div class="step-number">2</div>
                     <div class="step-text">
                       <strong>Verify Your Email:</strong> Use the OTP code above to verify your email address
                     </div>
                   </div>
                   
                   <div class="step">
                     <div class="step-number">3</div>
                     <div class="step-text">
                       <strong>Set Your Password:</strong> Create a secure password for your account
                     </div>
                   </div>
                   
                   <div class="step">
                     <div class="step-number">4</div>
                     <div class="step-text">
                       <strong>Complete Registration:</strong> Fill out your personal information, talent details, and other required steps
                     </div>
                   </div>
                   
                   <div class="step">
                     <div class="step-number">5</div>
                     <div class="step-text">
                       <strong>Submit:</strong> Since your slot is already paid for, you can fill in your details and submit directly after completing all steps
                     </div>
                   </div>
          </div>
          
            <div class="help-section">
              <p class="help-text">
                <strong>Need Help?</strong> If you have any questions about this invitation or the registration process, 
                please contact our support team. We're here to help you showcase your talent!
              </p>
            </div>
          </div>
          
          <div class="footer">
            <div class="footer-logo">
              <svg width="30" height="30" viewBox="0 0 30 30" fill="white">
                <circle cx="15" cy="15" r="12" fill="none" stroke="white" stroke-width="2"/>
                <path d="M10 12 L20 12 L21 8 L9 8 Z" fill="white"/>
                <rect x="14" y="14" width="2" height="8" fill="white"/>
                <rect x="12" y="22" width="6" height="1" fill="white"/>
              </svg>
            </div>
            
            <div class="footer-content">
              <div class="footer-title">Edo Talent Hunt</div>
              <div class="footer-subtitle">Empowering talents across Edo State and beyond</div>
              
              <div class="footer-text">
                © 2024 Edo Talent Hunt. All rights reserved.<br>
                This is an automated message, please do not reply directly to this email.
              </div>
            </div>
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