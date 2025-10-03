const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
require('dotenv').config();

// MongoDB connection
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/edo-talent-hunt';
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
};

// User Schema (simplified for script)
const UserSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: String,
  password: { type: String, select: false },
  role: { type: String, enum: ['contestant', 'admin', 'judge', 'sponsor'], default: 'contestant' },
  isEmailVerified: { type: Boolean, default: false },
  isPasswordSet: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', UserSchema);

// Email service setup
const createEmailTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp-relay.brevo.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// Email template for account activation (using existing email service style)
const generateActivationEmailTemplate = (firstName, email, temporaryPassword, isNewlyVerified = false) => {
  const verificationMessage = isNewlyVerified 
    ? 'Good news! We\'ve also verified your email address for you.'
    : '';
    
  const message = `We noticed that you started the registration process for Edo Talent Hunt but weren't able to complete setting up your account. To help you get started, we've activated your account and set a temporary password for you. ${verificationMessage}`;
    
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Account Activation - Edo Talent Hunt</title>
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
          font-size: 72px;
          filter: drop-shadow(2px 2px 8px rgba(218, 165, 32, 0.4));
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
        
        .password-card {
          background: linear-gradient(135deg, #FFF9E6 0%, #FFF5CC 100%);
          border: 3px solid #FFD700;
          border-radius: 20px;
          padding: 40px 30px;
          margin: 40px 0;
          position: relative;
          overflow: hidden;
        }
        
        .password-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 6px;
          background: linear-gradient(90deg, #FFD700, #F4D03F, #DAA520, #B8860B);
        }
        
        .password-title {
          font-size: 18px;
          color: #B8860B;
          font-weight: 700;
          margin-bottom: 25px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        
        .password-display {
          background: #ffffff;
          border: 3px dashed #DAA520;
          border-radius: 16px;
          padding: 30px 20px;
          margin: 25px 0;
          box-shadow: 0 8px 25px rgba(218, 165, 32, 0.2);
        }
        
        .password-code {
          font-size: 36px;
          font-weight: 900;
          color: #B8860B;
          letter-spacing: 4px;
          font-family: 'Courier New', monospace;
          text-shadow: 2px 2px 4px rgba(184, 134, 11, 0.3);
          margin: 0;
        }
        
        .warning {
          background: #FFF3E0;
          border: 2px solid #FFB74D;
          border-radius: 12px;
          padding: 20px;
          margin: 30px 0;
          color: #E65100;
          font-weight: 600;
        }
        
        .steps {
          text-align: left;
          margin: 30px 0;
          background: #F8F9FA;
          padding: 30px;
          border-radius: 16px;
          border-left: 6px solid #FFD700;
        }
        
        .steps h3 {
          color: #2D3748;
          margin-bottom: 20px;
          font-size: 20px;
        }
        
        .steps p {
          font-size: 16px;
          color: #4A5568;
          margin: 15px 0;
        }
        
        .action-buttons {
          margin: 40px 0;
        }
        
        .cta-button {
          display: inline-block;
          background: linear-gradient(135deg, #FFD700 0%, #F4D03F 100%);
          color: #1a1a1a !important;
          text-decoration: none;
          font-weight: 700;
          font-size: 16px;
          padding: 18px 35px;
          border-radius: 50px;
          margin: 10px;
          text-transform: uppercase;
          letter-spacing: 1px;
          box-shadow: 0 8px 25px rgba(255, 215, 0, 0.4);
          transition: all 0.3s ease;
          border: 2px solid #DAA520;
        }
        
        .secondary-button {
          background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
          color: #ffffff !important;
        }
        
        .footer {
          background: #F8F9FA;
          padding: 40px;
          text-align: center;
          border-top: 2px solid #E2E8F0;
        }
        
        .footer-text {
          color: #718096;
          font-size: 14px;
          line-height: 1.6;
        }
      </style>
    </head>
    <body>
      <div class="email-wrapper">
        <div class="header">
          <div class="circular-frame">
            <div class="logo">🎭</div>
          </div>
          <div class="brand-name">Edo Talent Hunt</div>
          <div class="brand-tagline">Account Activation</div>
        </div>
        
        <div class="content">
          <div class="greeting">Hello ${firstName}! 👋</div>
          <div class="message">${message}</div>
          
          <div class="password-card">
            <div class="password-title">Your Temporary Password</div>
            <div class="password-display">
              <div class="password-code">${temporaryPassword}</div>
            </div>
          </div>
          
          <div class="warning">
            ⚠️ <strong>Important Security Notice:</strong><br>
            This is a temporary password. For your security, please use the forgot password feature to set a new password.
          </div>
          
          <div class="steps">
            <h3>Next Steps:</h3>
            <p><strong>Do a forgot password to change your password and complete registration</strong></p>
            <p>1. Go to the login page</p>
            <p>2. Click "Forgot Password"</p>
            <p>3. Enter your email: <strong>${email}</strong></p>
            <p>4. Follow the instructions to set a new password</p>
            <p>5. Complete your registration</p>
          </div>
          
          <div class="action-buttons">
            <a href="https://edotalenthunt.com/forgot-password" class="cta-button">Reset Password</a>
            <a href="https://edotalenthunt.com/login" class="cta-button secondary-button">Go to Login</a>
          </div>
          
          <div class="message">
            If you have any questions or need assistance, please don't hesitate to contact our support team.<br><br>
            Welcome to Edo Talent Hunt! We're excited to see your talent shine. ✨
          </div>
        </div>
        
        <div class="footer">
          <div class="footer-text">
            <strong>The Edo Talent Hunt Team</strong><br><br>
            © 2024 Edo Talent Hunt. All rights reserved.<br>
            If you didn't request this account activation, please ignore this email.
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Function to find inactive accounts
const findInactiveAccounts = async () => {
  try {
    console.log('🔍 Searching for inactive accounts...');
    
    // Find users who started registration but couldn't complete it
    // This includes users who:
    // 1. Have accounts but email not verified OR password not set
    // 2. Are not explicitly deactivated
    const inactiveUsers = await User.find({
      $or: [
        { isEmailVerified: false }, // Email not verified
        { isPasswordSet: false }    // Password not set
      ],
      isActive: { $ne: false } // Not explicitly deactivated
    }).select('+password');
    
    console.log(`📊 Found ${inactiveUsers.length} inactive accounts`);
    
    if (inactiveUsers.length > 0) {
      console.log('\n📋 Inactive accounts found:');
      inactiveUsers.forEach((user, index) => {
        const issues = [];
        if (!user.isEmailVerified) issues.push('Email not verified');
        if (!user.isPasswordSet) issues.push('Password not set');
        
        console.log(`${index + 1}. ${user.firstName} ${user.lastName} (${user.email})`);
        console.log(`   Issues: ${issues.join(', ')}`);
      });
    }
    
    return inactiveUsers;
  } catch (error) {
    console.error('❌ Error finding inactive accounts:', error);
    return [];
  }
};

// Function to activate accounts and send emails
const activateAndEmailUsers = async (users) => {
  try {
    if (users.length === 0) {
      console.log('✅ No inactive accounts to process');
      return;
    }
    
    const defaultPassword = 'TalentHunt2024!';
    const hashedPassword = await bcrypt.hash(defaultPassword, 12);
    
    console.log('\n🔐 Activating accounts...');
    
    // Update all users
    const updatePromises = users.map(async (user) => {
      let isNewlyVerified = false;
      
      if (!user.isEmailVerified) {
        user.isEmailVerified = true;
        user.emailVerifiedAt = new Date();
        isNewlyVerified = true;
      }
      
      if (!user.isPasswordSet) {
        user.password = hashedPassword;
        user.isPasswordSet = true;
      }
      
      user.isActive = true;
      user.updatedAt = new Date();
      
      await user.save();
      return { user, isNewlyVerified };
    });
    
    const updatedUsers = await Promise.all(updatePromises);
    console.log('✅ All accounts activated successfully');
    
    // Setup email service
    console.log('\n📧 Setting up email service...');
    const transporter = createEmailTransporter();
    
    try {
      await transporter.verify();
      console.log('✅ Email service connected successfully');
    } catch (emailError) {
      console.error('❌ Email service connection failed:', emailError.message);
      console.log('⚠️ Accounts activated but emails will not be sent');
      return;
    }
    
    // Send emails
    console.log('\n📬 Sending activation emails...');
    
    const emailPromises = updatedUsers.map(async ({ user, isNewlyVerified }, index) => {
      try {
        const htmlContent = generateActivationEmailTemplate(
          user.firstName,
          user.email,
          defaultPassword,
          isNewlyVerified
        );
        
        const mailOptions = {
          from: `"Edo Talent Hunt" <${process.env.EMAIL_USER}>`,
          to: user.email,
          subject: '🎭 Your Edo Talent Hunt Account Has Been Activated',
          html: htmlContent
        };
        
        const result = await transporter.sendMail(mailOptions);
        console.log(`✅ Email sent to ${user.firstName} ${user.lastName} (${user.email})`);
        return { success: true, user: user.email };
      } catch (error) {
        console.error(`❌ Failed to send email to ${user.email}:`, error.message);
        return { success: false, user: user.email, error: error.message };
      }
    });
    
    const emailResults = await Promise.all(emailPromises);
    
    // Summary
    const successfulEmails = emailResults.filter(r => r.success).length;
    const failedEmails = emailResults.filter(r => !r.success).length;
    
    console.log('\n📊 Email Summary:');
    console.log(`✅ Successful: ${successfulEmails}`);
    console.log(`❌ Failed: ${failedEmails}`);
    
    if (failedEmails > 0) {
      console.log('\n❌ Failed emails:');
      emailResults.filter(r => !r.success).forEach(result => {
        console.log(`   - ${result.user}: ${result.error}`);
      });
    }
    
    console.log('\n🎉 Bulk activation process completed!');
    console.log(`🔑 Temporary password used: ${defaultPassword}`);
    console.log('📧 Users are instructed to use forgot password to reset their password');
    
  } catch (error) {
    console.error('❌ Error during bulk activation:', error);
  }
};

// Main execution
const main = async () => {
  await connectDB();
  
  console.log('🎭 Edo Talent Hunt - Bulk Account Activation');
  console.log('==========================================\n');
  
  // Find all inactive accounts
  const inactiveUsers = await findInactiveAccounts();
  
  if (inactiveUsers.length > 0) {
    // Show preview of what will happen
    console.log('\n📋 Preview of actions:');
    console.log(`   - ${inactiveUsers.length} accounts will be activated`);
    console.log('   - Temporary password will be set: TalentHunt2024!');
    console.log('   - Email verification will be completed where needed');
    console.log('   - Activation emails will be sent');
    
    // Process the accounts
    await activateAndEmailUsers(inactiveUsers);
  } else {
    console.log('✅ No inactive accounts found that need activation');
  }
  
  await mongoose.disconnect();
  console.log('\n🔌 Disconnected from MongoDB');
};

// Error handling
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Promise Rejection:', err);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});

// Run the script
main().catch(console.error);


