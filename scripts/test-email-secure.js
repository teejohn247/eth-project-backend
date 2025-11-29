require('dotenv').config();
const nodemailer = require('nodemailer');

console.log('🔍 Testing Email Service with Secure Connection (Port 465)\n');

// Try secure connection on port 465
const config = {
  host: process.env.EMAIL_HOST || 'smtp-relay.brevo.com',
  port: 465,
  secure: true, // Use TLS
  auth: {
    user: process.env.EMAIL_USER || process.env.BREVO_SMTP_USER,
    pass: process.env.BREVO_SMTP_KEY || process.env.EMAIL_PASS || ''
  },
  connectionTimeout: 15000,
  greetingTimeout: 15000,
  socketTimeout: 15000
};

console.log('📧 Email Configuration:');
console.log('   Host:', config.host);
console.log('   Port:', config.port, '(secure)');
console.log('   User:', config.auth.user);
console.log('   Has Password:', !!config.auth.pass);
console.log('');

const transporter = nodemailer.createTransport(config);

async function testConnection() {
  try {
    console.log('1️⃣ Testing SMTP connection with secure port 465...');
    await transporter.verify();
    console.log('✅ Connection successful!\n');
    
    console.log('2️⃣ Sending test email to teejohn247@gmail.com...');
    
    const mailOptions = {
      from: `"Edo Talent Hunt" <${process.env.EMAIL_FROM || 'edotalenthunt@themakersacad.com'}>`,
      to: 'teejohn247@gmail.com',
      subject: '🧪 Test Email - Edo Talent Hunt (Secure)',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #DAA520;">Email Service Test (Secure Connection)</h2>
          <p>This is a test email from the Edo Talent Hunt backend using secure port 465.</p>
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
      console.error('\n💡 Connection timeout - This might be a network/firewall issue.');
      console.error('   The SMTP server might be unreachable from your current network.');
      console.error('   Try:');
      console.error('   1. Check if you can access the internet');
      console.error('   2. Try from a different network');
      console.error('   3. Check if your firewall allows outbound connections on ports 587/465');
    }
    
    process.exit(1);
  }
}

testConnection();
