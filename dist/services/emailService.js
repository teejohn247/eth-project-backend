"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const nodemailer_1 = __importDefault(require("nodemailer"));
class EmailService {
    constructor() {
        const emailPort = parseInt(process.env.EMAIL_PORT || '465');
        const config = {
            host: process.env.EMAIL_HOST || 'smtp-relay.brevo.com',
            port: emailPort,
            secure: emailPort === 465,
            auth: {
                user: process.env.EMAIL_USER || '99c77c001@smtp-brevo.com',
                pass: process.env.BREVO_SMTP_KEY || process.env.EMAIL_PASS || ''
            }
        };
        console.log('📧 Email configuration:', {
            host: config.host,
            port: config.port,
            user: config.auth.user,
            hasPassword: !!config.auth.pass
        });
        this.fromEmail = process.env.EMAIL_FROM || 'edotalenthunt@themakersacad.com';
        this.transporter = nodemailer_1.default.createTransport(config);
    }
    async sendOTPEmail(email, otp, type) {
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
        }
        catch (error) {
            console.error('❌ Failed to send OTP email:', error);
            throw new Error('Failed to send OTP email');
        }
    }
    async sendBulkParticipantInvitation(email, otp, firstName, bulkRegistrationNumber) {
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
        }
        catch (error) {
            console.error('❌ Failed to send bulk invitation email:', error);
            throw new Error('Failed to send bulk invitation email');
        }
    }
    generateOTPEmailTemplate(email, otp, type) {
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
    generateBulkInvitationTemplate(email, otp, firstName, bulkRegistrationNumber) {
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
    async sendTicketEmail(email, firstName, lastName, purchaseReference, tickets, ticketNumbers, totalAmount) {
        const subject = '🎟️ Your Edo Talent Hunt Tickets';
        const htmlContent = this.generateTicketEmailTemplate(firstName, lastName, purchaseReference, tickets, ticketNumbers, totalAmount);
        const { TicketPdfGenerator } = await Promise.resolve().then(() => __importStar(require('../utils/ticketPdfGenerator')));
        const pdfTickets = tickets.flatMap((ticket, ticketIndex) => {
            const startIndex = tickets.slice(0, ticketIndex).reduce((sum, t) => sum + t.quantity, 0);
            return Array.from({ length: ticket.quantity }, (_, i) => ({
                ticketNumber: ticketNumbers[startIndex + i],
                ticketType: ticket.ticketType,
                price: ticket.unitPrice
            }));
        });
        const pdfBuffer = await TicketPdfGenerator.generateAllTicketsPdf(pdfTickets, {
            firstName,
            lastName,
            email,
            purchaseReference,
            purchaseDate: new Date(),
            totalAmount
        });
        const mailOptions = {
            from: `"Edo Talent Hunt" <${this.fromEmail}>`,
            to: email,
            subject,
            html: htmlContent,
            attachments: [
                {
                    filename: `Edo-Talent-Hunt-Tickets-${purchaseReference}.pdf`,
                    content: pdfBuffer,
                    contentType: 'application/pdf'
                }
            ]
        };
        try {
            await this.transporter.sendMail(mailOptions);
            console.log(`✅ Ticket email with PDF sent successfully to ${email}`);
        }
        catch (error) {
            console.error('❌ Failed to send ticket email:', error);
            const errorMessage = error.code === 'ESOCKET' || error.code === 'ETIMEDOUT'
                ? 'Email service connection timeout. Please check your network or SMTP configuration.'
                : error.message || 'Failed to send ticket email';
            throw new Error(errorMessage);
        }
    }
    generateTicketEmailTemplate(firstName, lastName, purchaseReference, tickets, ticketNumbers, totalAmount) {
        const ticketItems = tickets.map((ticket, index) => {
            const isVIP = ticket.ticketType.toUpperCase().includes('VIP') || ticket.ticketType.toUpperCase().includes('COUPLE');
            return `
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="padding: 12px 0; border-bottom: ${index < tickets.length - 1 ? '1px solid #27272A' : 'none'};">
          <tr>
            <td width="48" style="vertical-align: middle;">
              <div style="width: 48px; height: 48px; border-radius: 12px; text-align: center; line-height: 48px; font-size: 16px; font-weight: 700; ${isVIP ? 'background: rgba(251, 191, 36, 0.15); color: #FBBF24;' : 'background: #27272A; color: #A1A1AA;'}">
                ${ticket.quantity}×
              </div>
            </td>
            <td width="12"></td>
            <td style="vertical-align: middle;">
              <p style="color: #FFFFFF; font-size: 15px; font-weight: 600; margin: 0 0 4px 0; text-transform: uppercase;">${ticket.ticketType}</p>
              <p style="color: #71717A; font-size: 13px; margin: 0;">₦${ticket.unitPrice.toLocaleString()}/ticket</p>
            </td>
            <td width="20"></td>
            <td style="vertical-align: middle; text-align: right; white-space: nowrap;">
              <p style="color: #FFFFFF; font-weight: 700; margin: 0; font-size: 16px;">₦${ticket.totalPrice.toLocaleString()}</p>
            </td>
          </tr>
        </table>
      `;
        }).join('');
        const ticketNumberCards = ticketNumbers.map((num, index) => {
            return `
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: #27272A; border-radius: 12px; margin-bottom: 8px;">
          <tr>
            <td style="padding: 12px 16px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td width="24" style="vertical-align: middle;">
                    <span style="color: #FBBF24; font-size: 18px;">🎟️</span>
                  </td>
                  <td width="12"></td>
                  <td style="vertical-align: middle;">
                    <span style="color: #FFFFFF; font-family: 'Courier New', monospace; font-size: 14px;">${num}</span>
                  </td>
                  <td style="vertical-align: middle; text-align: right;">
                    <span style="color: #52525B; font-size: 12px;">#${index + 1}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      `;
        }).join('');
        const performersImageUrl = process.env.PERFORMERS_IMAGE_URL || 'https://res.cloudinary.com/dbwtjruq8/image/upload/v1768391085/edo-talent-hunt/email/performers-collage.jpg';
        const logoImageUrl = process.env.LOGO_IMAGE_URL || 'https://www.edotalenthunt.com/assets/img/project/eth-logo-wht.png';
        return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your Edo Talent Hunt Tickets</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            background: #09090B;
            margin: 0;
            padding: 16px;
          }
          
          .email-container {
            max-width: 512px;
            margin: 0 auto;
            background: #18181B;
            border-radius: 24px;
            overflow: hidden;
            border: 1px solid #27272A;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
          }
          
          .hero-section {
            position: relative;
            height: 240px;
            overflow: hidden;
            background: #09090B;
          }
          
          .hero-image {
            width: 100%;
            height: 100%;
            object-fit: cover;
            opacity: 0.85;
          }
          
          .hero-gradient {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(to bottom, rgba(9, 9, 11, 0) 0%, rgba(9, 9, 11, 0.4) 30%, rgba(24, 24, 27, 0.95) 85%, #18181B 100%);
          }
          
          .logo-badge {
            position: absolute;
            bottom: 0px;
            left: 50%;
            transform: translateX(-50%) rotate(2deg);
            z-index: 10;
            width: 88px;
            height: 88px;
            border-radius: 20px;
            background: linear-gradient(135deg, #FBBF24 0%, #F59E0B 100%);
            padding: 3px;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6), 0 0 0 4px rgba(251, 191, 36, 0.1);
          }
          
          .logo-badge-inner {
            width: 100%;
            height: 100%;
            border-radius: 17px;
            background: #18181B;
            padding: 12px;
            transform: rotate(-2deg);
          }
          
          .logo-badge img {
            display: block;
            width: 100%;
            height: auto;
            max-width: 64px;
            margin: 0 auto;
          }
          
          .content {
            padding: 60px 24px 32px;
            background: #18181B;
          }
          
          .brand-status {
            text-align: center;
            margin-bottom: 24px;
          }
          
          .brand-title {
            font-size: 18px;
            font-weight: 700;
            color: #FFFFFF;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 12px;
          }
          
          .success-badge {
            display: inline-block;
            padding: 6px 12px;
            border-radius: 20px;
            background: rgba(16, 185, 129, 0.1);
            border: 1px solid rgba(16, 185, 129, 0.2);
          }
          
          .success-dot {
            display: inline-block;
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: #34D399;
            margin-right: 8px;
            vertical-align: middle;
          }
          
          .success-text {
            color: #34D399;
            font-size: 12px;
            font-weight: 500;
            vertical-align: middle;
          }
          
          .greeting-section {
            text-align: center;
            margin-bottom: 24px;
          }
          
          .greeting-title {
            font-size: 20px;
            font-weight: 600;
            color: #FFFFFF;
            margin-bottom: 8px;
          }
          
          .greeting-subtitle {
            font-size: 14px;
            color: #A1A1AA;
          }
          
          .order-card {
            background: #09090B;
            border: 1px solid #27272A;
            border-radius: 16px;
            padding: 20px;
            margin-bottom: 24px;
          }
          
          .order-header {
            font-size: 12px;
            margin-bottom: 16px;
          }
          
          .order-label {
            color: #71717A;
          }
          
          .order-reference {
            color: #A1A1AA;
            font-family: 'Courier New', monospace;
          }
          
          .ticket-items {
            margin-bottom: 16px;
          }
          
          .total-row {
            padding-top: 16px;
            margin-top: 12px;
            border-top: 1px solid #3F3F46;
          }
          
          .total-label {
            color: #A1A1AA;
            font-size: 15px;
            font-weight: 500;
          }
          
          .total-amount {
            font-size: 24px;
            font-weight: 700;
            color: #FBBF24;
            letter-spacing: -0.5px;
          }
          
          .tickets-section {
            margin-bottom: 24px;
          }
          
          .tickets-label {
            color: #71717A;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            text-align: center;
            margin-bottom: 12px;
          }
          
          .event-info {
            background: rgba(251, 191, 36, 0.05);
            border-radius: 12px;
            padding: 16px;
            border: 1px solid rgba(251, 191, 36, 0.1);
          }
          
          .event-header {
            margin-bottom: 12px;
          }
          
          .event-icon {
            font-size: 18px;
          }
          
          .event-title {
            color: #FFFFFF;
            font-size: 14px;
            font-weight: 500;
          }
          
          .event-location {
            color: #71717A;
            font-size: 12px;
          }
          
          .event-list {
            color: #A1A1AA;
            font-size: 12px;
            margin-left: 32px;
            list-style: none;
          }
          
          .event-list li {
            margin-bottom: 4px;
          }
          
          .footer {
            padding: 24px;
            background: #09090B;
            border-top: 1px solid #27272A;
            text-align: center;
          }
          
          .footer-text {
            color: #52525B;
            font-size: 12px;
          }
          
          .footer-link {
            color: #71717A;
            text-decoration: none;
          }
          
          .footer-link:hover {
            color: #FBBF24;
          }
          
          @media (max-width: 600px) {
            body {
              padding: 8px;
            }
            
            .email-container {
              border-radius: 16px;
            }
            
            .hero-section {
              height: 144px;
            }
            
            .logo-badge {
              width: 64px;
              height: 64px;
            }
            
            .content {
              padding: 48px 20px 24px;
            }
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <!-- Hero Section -->
          <div class="hero-section">
            <img src="${performersImageUrl}" alt="Performers" class="hero-image" />
            <div class="hero-gradient"></div>
            
            <!-- Logo Badge -->
            <div class="logo-badge">
              <div class="logo-badge-inner">
                <img src="${logoImageUrl}" alt="Edo Talent Hunt" />
              </div>
            </div>
          </div>

          <!-- Main Content -->
          <div class="content">
            <!-- Brand & Status -->
            <div class="brand-status">
              <h1 class="brand-title">Edo Talent Hunt</h1>
              <div class="success-badge">
                <div class="success-dot"></div>
                <span class="success-text">Payment Successful</span>
              </div>
            </div>

            <!-- Greeting -->
            <div class="greeting-section">
              <h2 class="greeting-title">Hi ${firstName}! 🎉</h2>
              <p class="greeting-subtitle">Your tickets are confirmed and ready.</p>
            </div>

            <!-- Order Card -->
            <div class="order-card">
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 16px;">
                <tr>
                  <td class="order-label">Order</td>
                  <td class="order-reference" style="text-align: right;">${purchaseReference}</td>
                </tr>
              </table>
              
              <div class="ticket-items">
                ${ticketItems}
              </div>
              
              <table width="100%" cellpadding="0" cellspacing="0" border="0" class="total-row">
                <tr>
                  <td class="total-label">Total</td>
                  <td class="total-amount" style="text-align: right;">₦${totalAmount.toLocaleString()}</td>
                </tr>
              </table>
            </div>

            <!-- Ticket Numbers -->
            <div class="tickets-section">
              <p class="tickets-label">Your Tickets</p>
              <div>
                ${ticketNumberCards}
              </div>
            </div>

            <!-- Event Info -->
            <div class="event-info">
              <table width="100%" cellpadding="0" cellspacing="0" border="0" class="event-header">
                <tr>
                  <td width="24" style="vertical-align: top;">
                    <span class="event-icon">📍</span>
                  </td>
                  <td width="12"></td>
                  <td style="vertical-align: top;">
                    <p class="event-title">Grand Finale</p>
                    <p class="event-location">Victor Uwaifo Creative Hub, Benin City</p>
                  </td>
                </tr>
              </table>
              <ul class="event-list">
                <li>• Bring valid ID matching ticket name</li>
                <li>• Gates open 4PM — arrive early</li>
                <li>• Present this email at entry</li>
              </ul>
            </div>
          </div>

          <!-- Footer -->
          <div class="footer">
            <p class="footer-text">
              © 2026 Edo Talent Hunt • <a href="mailto:support@edotalenthunt.com" class="footer-link">Get Help</a>
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
    }
    async verifyConnection() {
        try {
            await this.transporter.verify();
            console.log('✅ Email service connection verified');
            return true;
        }
        catch (error) {
            console.error('❌ Email service connection failed:', error);
            return false;
        }
    }
}
exports.default = new EmailService();
//# sourceMappingURL=emailService.js.map