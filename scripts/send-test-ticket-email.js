// Load environment variables FIRST before any imports
require('dotenv').config();

const path = require('path');

// Import EmailService from dist (compiled TypeScript)
// Note: The singleton is created when this module is imported, so dotenv must be loaded first
const emailService = require('../dist/services/emailService').default;

async function sendTestTicketEmail() {
  try {
    console.log('🎟️ Sending Test Ticket Email\n');
    
    // Test ticket data
    const testTickets = [
      {
        ticketType: 'regular',
        quantity: 2,
        unitPrice: 10000,
        totalPrice: 20000
      },
      {
        ticketType: 'vip',
        quantity: 1,
        unitPrice: 50000,
        totalPrice: 50000
      }
    ];
    
    // Generate ticket numbers
    const ticketNumbers = [];
    testTickets.forEach((ticket, ticketIndex) => {
      for (let i = 0; i < ticket.quantity; i++) {
        const ticketTypePrefix = {
          'regular': 'ETH-REG',
          'vip': 'ETH-VIP',
          'table_of_5': 'ETH-GOLD',
          'table_of_10': 'ETH-SPON'
        }[ticket.ticketType] || 'ETH-TKT';
        
        const ticketNum = `${ticketTypePrefix}-${String(Date.now()).slice(-6)}-${String(i + 1).padStart(3, '0')}`;
        ticketNumbers.push(ticketNum);
      }
    });
    
    const purchaseData = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'teejohn247@gmail.com',
      purchaseReference: `TEST-${Date.now()}`,
      totalAmount: testTickets.reduce((sum, t) => sum + t.totalPrice, 0)
    };
    
    console.log('📋 Test Ticket Details:');
    console.log('   Email:', purchaseData.email);
    console.log('   Name:', `${purchaseData.firstName} ${purchaseData.lastName}`);
    console.log('   Purchase Reference:', purchaseData.purchaseReference);
    console.log('   Total Amount: ₦' + purchaseData.totalAmount.toLocaleString());
    console.log('   Tickets:', testTickets.length, 'types');
    testTickets.forEach((t, i) => {
      console.log(`      ${i + 1}. ${t.ticketType.toUpperCase()}: ${t.quantity} x ₦${t.unitPrice.toLocaleString()}`);
    });
    console.log('   Total Ticket Numbers:', ticketNumbers.length);
    console.log('');
    
    console.log('📧 Sending email with PDF tickets...');
    
    await emailService.sendTicketEmail(
      purchaseData.email,
      purchaseData.firstName,
      purchaseData.lastName,
      purchaseData.purchaseReference,
      testTickets,
      ticketNumbers,
      purchaseData.totalAmount
    );
    
    console.log('✅ Email sent successfully!');
    console.log('📬 Please check teejohn247@gmail.com inbox (and spam folder)');
    console.log('📎 The PDF file with all tickets should be attached to the email');
    console.log('\n🎉 Test completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Failed to send test ticket email!\n');
    console.error('Error:', error.message);
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
    process.exit(1);
  }
}

sendTestTicketEmail();

