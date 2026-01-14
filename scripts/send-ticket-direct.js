// Trigger EmailService directly with explicit credentials
// Load environment first - BEFORE any other imports
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Hardcode credentials as fallback since .env is not loading properly
if (!process.env.EMAIL_PASS) {
  process.env.EMAIL_HOST = 'smtp-relay.brevo.com';
  process.env.EMAIL_PORT = '465';
  process.env.EMAIL_USER = 'teejohn247@gmail.com';
  process.env.EMAIL_PASS = 'UOvqHAFnMBygDx7z';
  process.env.EMAIL_FROM = 'teejohn247@gmail.com';
  console.log('⚠️  Loaded credentials manually (env file not loading properly)');
}

console.log('✅ Environment configured');
console.log('📧 EMAIL_USER:', process.env.EMAIL_USER);
console.log('📧 EMAIL_PASS:', process.env.EMAIL_PASS ? '***' + process.env.EMAIL_PASS.slice(-4) : 'NOT SET');

// Now import EmailService after env is loaded
const emailService = require('../dist/services/emailService').default;

async function sendTicketEmail() {
  try {
    console.log('\n🎟️ Sending ticket email directly from EmailService...\n');

    const email = 'teejohn247@gmail.com';
    const firstName = 'John';
    const lastName = 'Doe';
    const purchaseReference = `ETH-2026-${Date.now().toString().slice(-6)}`;
    
    const tickets = [
      { ticketType: 'REGULAR', quantity: 2, unitPrice: 10000, totalPrice: 20000 },
      { ticketType: 'VIP', quantity: 1, unitPrice: 50000, totalPrice: 50000 }
    ];
    
    const ticketNumbers = [
      'ETH-2026-REG001',
      'ETH-2026-REG002',
      'ETH-2026-VIP001'
    ];
    
    const totalAmount = 70000;

    console.log('📋 Ticket Details:');
    console.log('   Recipient:', email);
    console.log('   Name:', firstName, lastName);
    console.log('   Reference:', purchaseReference);
    console.log('   Total Amount:', `₦${totalAmount.toLocaleString()}`);
    console.log('   Tickets:', tickets.length, 'types');
    console.log('   Ticket Numbers:', ticketNumbers.length);

    console.log('\n📤 Calling EmailService.sendTicketEmail()...\n');

    await emailService.sendTicketEmail(
      email,
      firstName,
      lastName,
      purchaseReference,
      tickets,
      ticketNumbers,
      totalAmount
    );

    console.log('\n✅ Email sent successfully!');
    console.log('📬 Check teejohn247@gmail.com inbox (and spam folder)');
    console.log('🎨 The email includes:');
    console.log('   • Hero section with performers collage image');
    console.log('   • Logo badge with rotation');
    console.log('   • Dark theme design (zinc colors)');
    console.log('   • Ticket summary with quantity badges');
    console.log('   • Individual ticket numbers with notches');
    console.log('   • Event information');
    console.log('   • PDF attachment with all tickets');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

sendTicketEmail();

