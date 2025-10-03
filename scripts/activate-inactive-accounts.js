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

// Email template for account activation
const generateActivationEmailTemplate = (firstName, email, temporaryPassword) => {
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Account Activation - Edo Talent Hunt</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 30px 20px; border-radius: 0 0 8px 8px; }
        .password-box { background: #fff; border: 2px dashed #667eea; padding: 20px; margin: 20px 0; text-align: center; border-radius: 8px; }
        .password { font-size: 24px; font-weight: bold; color: #667eea; letter-spacing: 2px; }
        .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 10px 5px; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎭 Edo Talent Hunt</h1>
            <h2>Account Activation</h2>
        </div>
        
        <div class="content">
            <p>Hello <strong>${firstName}</strong>,</p>
            
            <p>We noticed that you started the registration process for Edo Talent Hunt but weren't able to complete setting up your password. To help you get started, we've activated your account and set a temporary password for you.</p>
            
            <div class="password-box">
                <p><strong>Your Temporary Password:</strong></p>
                <div class="password">${temporaryPassword}</div>
            </div>
            
            <div class="warning">
                <strong>⚠️ Important Security Notice:</strong><br>
                This is a temporary password. For your security, we strongly recommend that you log in and change your password immediately.
            </div>
            
            <h3>Next Steps:</h3>
            <ol>
                <li><strong>Log in</strong> to your account using your email and the temporary password above</li>
                <li><strong>Change your password</strong> immediately after logging in</li>
                <li><strong>Complete your registration</strong> if you haven't already</li>
            </ol>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="https://edotalenthunt.com/login" class="button">Log In Now</a>
                <a href="https://edotalenthunt.com/forgot-password" class="button" style="background: #28a745;">Reset Password</a>
            </div>
            
            <h3>Alternative: Reset Password</h3>
            <p>If you prefer, you can also use the "Forgot Password" feature on our login page. Simply:</p>
            <ol>
                <li>Go to the login page</li>
                <li>Click "Forgot Password"</li>
                <li>Enter your email: <strong>${email}</strong></li>
                <li>Follow the instructions in the reset email</li>
            </ol>
            
            <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
            
            <p>Welcome to Edo Talent Hunt! We're excited to see your talent shine.</p>
            
            <p>Best regards,<br>
            <strong>The Edo Talent Hunt Team</strong></p>
        </div>
        
        <div class="footer">
            <p>© 2024 Edo Talent Hunt. All rights reserved.</p>
            <p>If you didn't request this account activation, please ignore this email.</p>
        </div>
    </div>
</body>
</html>
  `;
};

// Main function to activate accounts
const activateInactiveAccounts = async () => {
  try {
    console.log('🔍 Searching for inactive accounts...');
    
    // Find users who are inactive because they couldn't set a password
    // These are users who have isEmailVerified = true but isPasswordSet = false
    const inactiveUsers = await User.find({
      isEmailVerified: true,
      isPasswordSet: false,
      isActive: { $ne: false } // Not explicitly deactivated
    }).select('+password');
    
    console.log(`📊 Found ${inactiveUsers.length} inactive accounts`);
    
    if (inactiveUsers.length === 0) {
      console.log('✅ No inactive accounts found that need activation');
      return;
    }
    
    // Display users found
    console.log('\n📋 Inactive accounts found:');
    inactiveUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.firstName} ${user.lastName} (${user.email})`);
    });
    
    // Set default password
    const defaultPassword = 'TalentHunt2024!';
    const hashedPassword = await bcrypt.hash(defaultPassword, 12);
    
    console.log('\n🔐 Setting passwords for inactive accounts...');
    
    // Update all inactive users
    const updatePromises = inactiveUsers.map(async (user) => {
      user.password = hashedPassword;
      user.isPasswordSet = true;
      user.isActive = true;
      user.updatedAt = new Date();
      return user.save();
    });
    
    await Promise.all(updatePromises);
    console.log('✅ Passwords set for all inactive accounts');
    
    // Setup email transporter
    console.log('\n📧 Setting up email service...');
    const transporter = createEmailTransporter();
    
    // Test email connection
    try {
      await transporter.verify();
      console.log('✅ Email service connected successfully');
    } catch (emailError) {
      console.error('❌ Email service connection failed:', emailError.message);
      console.log('⚠️ Continuing without sending emails...');
      return;
    }
    
    // Send activation emails
    console.log('\n📬 Sending activation emails...');
    
    const emailPromises = inactiveUsers.map(async (user, index) => {
      try {
        const htmlContent = generateActivationEmailTemplate(
          user.firstName,
          user.email,
          defaultPassword
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
    
    console.log('\n🎉 Account activation process completed!');
    console.log(`📧 Default password used: ${defaultPassword}`);
    console.log('⚠️  Users are instructed to change their password after logging in');
    
  } catch (error) {
    console.error('❌ Error during account activation:', error);
  }
};

// Test with specific email function
const testWithSpecificEmail = async (email) => {
  try {
    console.log(`🔍 Testing with specific email: ${email}`);
    
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      console.log(`❌ User not found with email: ${email}`);
      return;
    }
    
    console.log(`📋 User found: ${user.firstName} ${user.lastName}`);
    console.log(`   - Email Verified: ${user.isEmailVerified}`);
    console.log(`   - Password Set: ${user.isPasswordSet}`);
    console.log(`   - Active: ${user.isActive}`);
    
    if (user.isEmailVerified && !user.isPasswordSet) {
      console.log('✅ This user qualifies for activation');
      
      // Set password
      const defaultPassword = 'TalentHunt2024!';
      const hashedPassword = await bcrypt.hash(defaultPassword, 12);
      
      user.password = hashedPassword;
      user.isPasswordSet = true;
      user.isActive = true;
      user.updatedAt = new Date();
      await user.save();
      
      console.log('✅ Password set successfully');
      
      // Send email
      const transporter = createEmailTransporter();
      
      try {
        await transporter.verify();
        console.log('✅ Email service connected');
        
        const htmlContent = generateActivationEmailTemplate(
          user.firstName,
          user.email,
          defaultPassword
        );
        
        const mailOptions = {
          from: `"Edo Talent Hunt" <${process.env.EMAIL_USER}>`,
          to: user.email,
          subject: '🎭 Your Edo Talent Hunt Account Has Been Activated',
          html: htmlContent
        };
        
        await transporter.sendMail(mailOptions);
        console.log('✅ Activation email sent successfully');
        
      } catch (emailError) {
        console.error('❌ Email sending failed:', emailError.message);
      }
      
    } else {
      console.log('❌ This user does not qualify for activation');
      if (!user.isEmailVerified) console.log('   - Email not verified');
      if (user.isPasswordSet) console.log('   - Password already set');
    }
    
  } catch (error) {
    console.error('❌ Error during test:', error);
  }
};

// Main execution
const main = async () => {
  await connectDB();
  
  const testEmail = 'aya@yopmail.com';
  
  console.log('🎭 Edo Talent Hunt - Account Activation Script');
  console.log('=============================================\n');
  
  // First test with the specific email
  await testWithSpecificEmail(testEmail);
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Then run for all inactive accounts
  await activateInactiveAccounts();
  
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
