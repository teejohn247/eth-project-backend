/**
 * Find Pending Ticket Purchases
 * 
 * Lists all pending ticket purchases that can be used for webhook testing
 */

require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/edo-talent-hunt';

async function findPendingPurchases() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected\n');

    const TicketPurchase = require('../dist/models/TicketPurchase').default;

    console.log('🔍 Finding pending ticket purchases...\n');

    const pendingPurchases = await TicketPurchase.find({
      paymentStatus: { $in: ['pending', 'processing'] }
    })
    .sort({ createdAt: -1 })
    .limit(10);

    if (pendingPurchases.length === 0) {
      console.log('No pending purchases found.\n');
      return;
    }

    console.log(`Found ${pendingPurchases.length} pending purchase(s):\n`);
    console.log('=' .repeat(80));

    pendingPurchases.forEach((purchase, index) => {
      console.log(`\n${index + 1}. Purchase Reference: ${purchase.purchaseReference}`);
      console.log(`   Payment Reference: ${purchase.paymentReference || 'N/A'}`);
      console.log(`   Customer: ${purchase.firstName} ${purchase.lastName}`);
      console.log(`   Email: ${purchase.email}`);
      console.log(`   Amount: ₦${purchase.totalAmount.toLocaleString()}`);
      console.log(`   Status: ${purchase.paymentStatus}`);
      console.log(`   Ticket Sent: ${purchase.ticketSent}`);
      console.log(`   Created: ${purchase.createdAt.toLocaleString()}`);
      console.log(`   Tickets: ${purchase.tickets.map(t => `${t.quantity}x ${t.ticketType}`).join(', ')}`);
    });

    console.log('\n' + '=' .repeat(80));
    console.log('\n💡 To test webhook with any of these:');
    console.log('   node scripts/test-webhook-simple.js <PAYMENT_REFERENCE>\n');
    console.log('Example:');
    if (pendingPurchases[0].paymentReference) {
      console.log(`   node scripts/test-webhook-simple.js ${pendingPurchases[0].paymentReference}\n`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

findPendingPurchases();

