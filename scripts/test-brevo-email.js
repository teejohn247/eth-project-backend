const nodemailer = require('nodemailer');
const fs = require('fs');
require('dotenv').config();

// Brevo SMTP Configuration
const SMTP_CONFIG = {
  host: 'smtp-relay.brevo.com',
  port: 587,
  secure: false,
  auth: {
    user: '99c77c001@smtp-brevo.com',
    pass: process.env.BREVO_SMTP_KEY
  }
};

// Test recipient - teejohn247
const testRecipient = {
  name: 'Tolu Ajuwon',
  email: 'teejohn247@gmail.com',
  password: 'TestPassword123!' // This is just for testing the email format
};

async function sendTestEmail() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('BREVO EMAIL TEST - Sending to teejohn247@gmail.com');
  console.log('═══════════════════════════════════════════════════════════\n');

  // Create transporter
  const transporter = nodemailer.createTransport(SMTP_CONFIG);

  // Verify connection
  console.log('Testing SMTP connection...');
  try {
    await transporter.verify();
    console.log('✅ SMTP connection verified\n');
  } catch (error) {
    console.error('❌ SMTP connection failed:', error.message);
    console.log('\nMake sure you have set BREVO_SMTP_KEY in your .env file');
    console.log('Run: echo "BREVO_SMTP_KEY=your_key_here" >> .env\n');
    process.exit(1);
  }

  // Create test email content
  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Edo Talent Hunt - Test Email</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #1a472a 0%, #2d5f3d 100%); padding: 40px 30px; text-align: center;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">
                                Edo Talent Hunt
                            </h1>
                            <p style="color: #e0e0e0; margin: 10px 0 0 0; font-size: 16px;">
                                Test Email - Brevo Integration
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Main Content -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <h2 style="color: #333333; margin: 0 0 20px 0; font-size: 24px;">
                                Hello ${testRecipient.name}!
                            </h2>
                            
                            <p style="color: #666666; line-height: 1.6; margin: 0 0 20px 0; font-size: 16px;">
                                This is a test email from the Edo Talent Hunt system using Brevo SMTP.
                            </p>
                            
                            <p style="color: #666666; line-height: 1.6; margin: 0 0 20px 0; font-size: 16px;">
                                If you're receiving this, the email integration is working perfectly! ✅
                            </p>
                            
                            <!-- Test Credentials Box -->
                            <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f9f9f9; border: 2px solid #1a472a; border-radius: 8px; margin: 30px 0;">
                                <tr>
                                    <td style="padding: 25px;">
                                        <p style="color: #333333; margin: 0 0 15px 0; font-size: 16px; font-weight: bold;">
                                            Test Credentials Format:
                                        </p>
                                        <table role="presentation" style="width: 100%; border-collapse: collapse;">
                                            <tr>
                                                <td style="padding: 8px 0;">
                                                    <strong style="color: #333333; font-size: 14px;">Email:</strong>
                                                </td>
                                                <td style="padding: 8px 0; text-align: right;">
                                                    <span style="color: #1a472a; font-size: 14px; font-weight: 600;">${testRecipient.email}</span>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 8px 0;">
                                                    <strong style="color: #333333; font-size: 14px;">Password:</strong>
                                                </td>
                                                <td style="padding: 8px 0; text-align: right;">
                                                    <code style="background-color: #ffffff; padding: 8px 12px; border-radius: 4px; color: #d9534f; font-size: 16px; font-weight: bold; border: 1px solid #e0e0e0;">${testRecipient.password}</code>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                            
                            <div style="background-color: #d1ecf1; border-left: 4px solid #0c5460; padding: 15px 20px; margin: 25px 0; border-radius: 4px;">
                                <p style="color: #0c5460; margin: 0; font-size: 14px; line-height: 1.6;">
                                    <strong>📧 Email System Status:</strong><br>
                                    ✅ Brevo SMTP Connected<br>
                                    ✅ HTML Email Rendering<br>
                                    ✅ Ready to send activation emails
                                </p>
                            </div>
                            
                            <p style="color: #666666; line-height: 1.6; margin: 20px 0 0 0; font-size: 14px;">
                                This is a test message. If everything looks good, you can proceed to send the actual activation emails to all users.
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f9f9f9; padding: 30px; text-align: center; border-top: 1px solid #e0e0e0;">
                            <p style="color: #999999; margin: 0 0 10px 0; font-size: 14px;">
                                Edo Talent Hunt - Showcasing Edo State's Finest Talents
                            </p>
                            <p style="color: #999999; margin: 0; font-size: 12px;">
                                © 2025 Edo Talent Hunt. All rights reserved.
                            </p>
                            <p style="color: #999999; margin: 15px 0 0 0; font-size: 12px;">
                                This is a test message from the automated email system.
                            </p>
                        </td>
                    </tr>
                    
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;

  const textContent = `═══════════════════════════════════════════════════════════
EDO TALENT HUNT - TEST EMAIL
═══════════════════════════════════════════════════════════

Hello ${testRecipient.name},

This is a test email from the Edo Talent Hunt system using Brevo SMTP.

If you're receiving this, the email integration is working perfectly! ✅

───────────────────────────────────────────────────────────
TEST CREDENTIALS FORMAT
───────────────────────────────────────────────────────────

Email:    ${testRecipient.email}
Password: ${testRecipient.password}

───────────────────────────────────────────────────────────

📧 Email System Status:
✅ Brevo SMTP Connected
✅ HTML Email Rendering
✅ Ready to send activation emails

This is a test message. If everything looks good, you can proceed 
to send the actual activation emails to all users.

═══════════════════════════════════════════════════════════
Edo Talent Hunt - Showcasing Edo State's Finest Talents
© 2025 Edo Talent Hunt. All rights reserved.
═══════════════════════════════════════════════════════════`;

  console.log('Sending test email...');
  console.log(`To: ${testRecipient.email}`);
  console.log(`Name: ${testRecipient.name}\n`);

  try {
    // Email options
    const mailOptions = {
      from: '"Edo Talent Hunt" <edotalenthunt@themakersacad.com>',
      to: testRecipient.email,
      subject: '🧪 Test - Edo Talent Hunt Email System',
      text: textContent,
      html: htmlContent
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);
    
    console.log('✅ TEST EMAIL SENT SUCCESSFULLY!\n');
    console.log('Details:');
    console.log(`  Message ID: ${info.messageId}`);
    console.log(`  Recipient: ${testRecipient.email}`);
    console.log(`  Response: ${info.response}\n`);
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('✅ EMAIL SYSTEM IS WORKING!');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('\nYou can now send activation emails to all users by running:');
    console.log('  node scripts/send-emails-brevo.js\n');
    
  } catch (error) {
    console.error('❌ FAILED TO SEND TEST EMAIL\n');
    console.error('Error:', error.message);
    
    if (error.code === 'EAUTH') {
      console.log('\n💡 Authentication failed. Check:');
      console.log('  1. BREVO_SMTP_KEY is correct in .env file');
      console.log('  2. The SMTP key is active in Brevo dashboard');
    } else if (error.code === 'ECONNECTION') {
      console.log('\n💡 Connection failed. Check:');
      console.log('  1. Internet connection');
      console.log('  2. Firewall settings');
    }
    
    process.exit(1);
  }
}

// Run the test
sendTestEmail().catch(console.error);

