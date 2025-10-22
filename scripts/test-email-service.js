require('dotenv').config();
const emailService = require('../dist/services/emailService').default;

async function testEmailService() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('TESTING EMAIL SERVICE WITH BREVO');
  console.log('═══════════════════════════════════════════════════════════\n');

  try {
    // First verify the connection
    console.log('1. Verifying email service connection...');
    const isConnected = await emailService.verifyConnection();
    
    if (!isConnected) {
      console.error('❌ Email service connection failed. Check your .env configuration.');
      process.exit(1);
    }

    console.log('\n2. Sending test OTP email to teejohn247@gmail.com...\n');

    // Generate a test OTP
    const testOTP = Math.floor(100000 + Math.random() * 900000).toString();
    console.log(`📧 Test OTP Code: ${testOTP}`);

    // Send verification email
    await emailService.sendOTPEmail(
      'teejohn247@gmail.com',
      testOTP,
      'verification'
    );

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('✅ VERIFICATION EMAIL SENT SUCCESSFULLY!');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('\nCheck teejohn247@gmail.com inbox for the verification email.');
    console.log('(Don\'t forget to check spam/junk folder)\n');

    // Also test password reset email
    console.log('3. Sending test password reset email...\n');
    const resetOTP = Math.floor(100000 + Math.random() * 900000).toString();
    console.log(`🔐 Password Reset OTP: ${resetOTP}`);

    await emailService.sendOTPEmail(
      'teejohn247@gmail.com',
      resetOTP,
      'password_reset'
    );

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('✅ BOTH EMAIL TYPES SENT SUCCESSFULLY!');
    console.log('═══════════════════════════════════════════════════════════\n');

    process.exit(0);

  } catch (error) {
    console.error('\n❌ EMAIL SERVICE TEST FAILED\n');
    console.error('Error:', error.message);
    
    if (error.message.includes('BREVO_SMTP_KEY')) {
      console.log('\n💡 Make sure BREVO_SMTP_KEY is set in your .env file');
    }
    
    process.exit(1);
  }
}

// Run the test
testEmailService();

