// Load environment variables FIRST before any other imports
require('dotenv').config();

console.log('🔧 Environment loaded');
console.log('   BREVO_SMTP_USER:', process.env.BREVO_SMTP_USER);
console.log('   Has password:', !!process.env.BREVO_SMTP_PASSWORD);

// Now import EmailService after env is loaded
const emailService = require('../dist/services/emailService').default;
const TicketPdfGenerator = require('../dist/utils/ticketPdfGenerator').TicketPdfGenerator;

async function sendEmail() {
  try {
    console.log('\n📧 Sending email to teejohn247@gmail.com...\n');

    // Test data
    const purchaseData = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'teejohn247@gmail.com',
      purchaseReference: `ETH-2026-${Date.now().toString().slice(-6)}`,
      purchaseDate: new Date(),
      totalAmount: 70000
    };

    const tickets = [
      { ticketNumber: 'ETH-2026-REG001', ticketType: 'regular', price: 10000 },
      { ticketNumber: 'ETH-2026-REG002', ticketType: 'regular', price: 10000 },
      { ticketNumber: 'ETH-2026-VIP001', ticketType: 'vip', price: 50000 }
    ];

    const ticketSummary = [
      { ticketType: 'REGULAR', quantity: 2, unitPrice: 10000, totalPrice: 20000 },
      { ticketType: 'VIP', quantity: 1, unitPrice: 50000, totalPrice: 50000 }
    ];

    console.log('📋 Purchase Details:');
    console.log('   Name:', purchaseData.firstName, purchaseData.lastName);
    console.log('   Email:', purchaseData.email);
    console.log('   Reference:', purchaseData.purchaseReference);
    console.log('   Total:', `₦${purchaseData.totalAmount.toLocaleString()}`);
    console.log('   Tickets:', tickets.length);

    // Generate PDF
    console.log('\n📄 Generating PDF...');
    const pdfBuffer = await TicketPdfGenerator.generateAllTicketsPdf(tickets, purchaseData);
    console.log('✅ PDF generated:', pdfBuffer.length, 'bytes');

    // Send email
    console.log('\n📤 Sending email with ticket attachment...');
    await emailService.sendTicketEmail(
      purchaseData.email,
      purchaseData.firstName,
      purchaseData.lastName,
      purchaseData.purchaseReference,
      ticketSummary,
      tickets.map(t => t.ticketNumber),
      purchaseData.totalAmount,
      pdfBuffer
    );

    console.log('\n✅ Email sent successfully!');
    console.log('📬 Check teejohn247@gmail.com inbox (and spam folder)');
    console.log('🎨 The email includes:');
    console.log('   • Performers collage image in hero section');
    console.log('   • Edo Talent Hunt logo badge');
    console.log('   • Dark theme design');
    console.log('   • PDF ticket attachment');
    
  } catch (error) {
    console.error('\n❌ Error sending email:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

sendEmail();

