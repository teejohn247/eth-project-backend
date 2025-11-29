require('dotenv').config();
const nodemailer = require('nodemailer');

console.log('🔍 Testing Email Service Connection\n');

// Email configuration
const config = {
  host: process.env.EMAIL_HOST || 'smtp-relay.brevo.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER || '99c77c001@smtp-brevo.com',
    pass: process.env.BREVO_SMTP_KEY || process.env.EMAIL_PASS || ''
  },
  connectionTimeout: 10000, // 10 seconds
  greetingTimeout: 10000,
  socketTimeout: 10000
};

console.log('📧 Email Configuration:');
console.log('   Host:', config.host);
console.log('   Port:', config.port);
console.log('   User:', config.auth.user);
console.log('   Has Password:', !!config.auth.pass);
console.log('');

const transporter = nodemailer.createTransport(config);

async function testConnection() {
  try {
    console.log('1️⃣ Testing SMTP connection...');
    await transporter.verify();
    console.log('✅ Connection successful!\n');
    
    console.log('2️⃣ Sending test email to teejohn247@gmail.com...');
    
    const mailOptions = {
      from: `"Edo Talent Hunt" <${process.env.EMAIL_FROM || 'edotalenthunt@themakersacad.com'}>`,
      to: 'teejohn247@gmail.com',
      subject: '🧪 Test Email - Edo Talent Hunt',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #DAA520;">Email Service Test</h2>
          <p>This is a test email from the Edo Talent Hunt backend.</p>
          <p>If you received this email, the email service is working correctly! ✅</p>
          <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
        </div>
      `
    };
    
    const info = await transporter.sendMail(mailOptions);
    
    console.log('✅ Email sent successfully!');
    console.log('   Message ID:', info.messageId);
    console.log('   Response:', info.response);
    console.log('\n🎉 Test completed successfully!');
    console.log('📬 Please check teejohn247@gmail.com inbox (and spam folder)');
    
  } catch (error) {
    console.error('\n❌ Test failed!\n');
    console.error('Error:', error.message);
    console.error('Code:', error.code || 'N/A');
    
    if (error.code === 'ETIMEDOUT' || error.code === 'ESOCKET') {
      console.error('\n💡 Connection timeout issues:');
      console.error('   - Check your internet connection');
      console.error('   - Verify SMTP host and port are correct');
      console.error('   - Check if firewall is blocking port 587');
      console.error('   - Try using port 465 with secure: true');
    } else if (error.code === 'EAUTH') {
      console.error('\n💡 Authentication failed:');
      console.error('   - Verify EMAIL_USER and BREVO_SMTP_KEY are correct');
      console.error('   - For Brevo, use your SMTP key, not password');
    } else if (error.response) {
      console.error('Response:', error.response);
    }
    
    process.exit(1);
  }
}

testConnection();

