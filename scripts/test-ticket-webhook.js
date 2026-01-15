/**
 * Test Ticket Payment Webhook
 * 
 * This script simulates a payment gateway webhook to test the ticket payment flow.
 * It will:
 * 1. Create a test ticket purchase (or use existing one)
 * 2. Send a webhook payload to the server
 * 3. Verify the results
 */

require('dotenv').config();
const axios = require('axios');
const mongoose = require('mongoose');

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/edo-talent-hunt';

// Test data
const TEST_CUSTOMER = {
  firstName: 'Test',
  lastName: 'Customer',
  email: 'teejohn247@gmail.com',
  phone: '08161582774'
};

async function createTestTicketPurchase() {
  try {
    console.log('🎫 Creating test ticket purchase...\n');

    // Import models
    const TicketPurchase = require('../dist/models/TicketPurchase').default;
    const PaymentTransaction = require('../dist/models/PaymentTransaction').default;
    const Ticket = require('../dist/models/Ticket').default;

    // Generate references
    const purchaseReference = `TICKET_TEST_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const paymentReference = `CREDO_TEST_${Date.now()}`;

    console.log(`Purchase Reference: ${purchaseReference}`);
    console.log(`Payment Reference: ${paymentReference}\n`);

    // Get a ticket to purchase
    const regularTicket = await Ticket.findOne({ ticketType: 'regular', isActive: true });
    
    if (!regularTicket) {
      throw new Error('No active regular ticket found');
    }

    // Create ticket purchase
    const ticketPurchase = new TicketPurchase({
      purchaseReference,
      firstName: TEST_CUSTOMER.firstName,
      lastName: TEST_CUSTOMER.lastName,
      email: TEST_CUSTOMER.email,
      phone: TEST_CUSTOMER.phone,
      tickets: [{
        ticketId: regularTicket._id,
        ticketType: 'regular',
        quantity: 2,
        unitPrice: regularTicket.price,
        totalPrice: regularTicket.price * 2
      }],
      totalAmount: regularTicket.price * 2,
      currency: 'NGN',
      paymentStatus: 'pending',
      paymentReference,
      ticketNumbers: [
        `ETH-TKT-TEST-001`,
        `ETH-TKT-TEST-002`
      ],
      ticketSent: false
    });

    await ticketPurchase.save();
    console.log('✅ Ticket purchase created');
    console.log(`   Total Amount: ₦${ticketPurchase.totalAmount.toLocaleString()}`);
    console.log(`   Tickets: ${ticketPurchase.tickets[0].quantity}x Regular`);
    console.log(`   Status: ${ticketPurchase.paymentStatus}\n`);

    // Create payment transaction
    const paymentTransaction = new PaymentTransaction({
      registrationId: null,
      userId: null,
      reference: paymentReference,
      amount: ticketPurchase.totalAmount,
      currency: 'NGN',
      status: 'initiated',
      paymentMethod: 'card'
    });

    await paymentTransaction.save();
    console.log('✅ Payment transaction created\n');

    return {
      purchaseReference,
      paymentReference,
      amount: ticketPurchase.totalAmount,
      email: ticketPurchase.email
    };

  } catch (error) {
    console.error('❌ Error creating test purchase:', error.message);
    throw error;
  }
}

async function sendWebhook(paymentReference, amount) {
  try {
    console.log('📤 Sending webhook to server...\n');

    // Simulate Credo payment gateway webhook payload
    const webhookPayload = {
      event: 'TRANSACTION.SUCCESSFUL',
      transRef: paymentReference,
      reference: paymentReference,
      businessRef: paymentReference,
      status: 0, // 0 = success in Credo
      data: {
        status: 0,
        transRef: paymentReference,
        transAmount: amount,
        currencyCode: 'NGN',
        paymentMethod: 'card',
        channelId: '1',
        responseMessage: 'Approved',
        customer: {
          customerEmail: TEST_CUSTOMER.email,
          firstName: TEST_CUSTOMER.firstName,
          lastName: TEST_CUSTOMER.lastName,
          phoneNo: TEST_CUSTOMER.phone
        }
      }
    };

    console.log('Webhook Payload:');
    console.log(JSON.stringify(webhookPayload, null, 2));
    console.log('\n');

    // Send webhook request
    const response = await axios.post(
      `${API_BASE_URL}/api/v1/payments/webhook`,
      webhookPayload,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Webhook Response:\n');
    console.log(JSON.stringify(response.data, null, 2));
    console.log('\n');

    return response.data;

  } catch (error) {
    if (error.response) {
      console.error('❌ Webhook failed:');
      console.error('Status:', error.response.status);
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('❌ Webhook request error:', error.message);
    }
    throw error;
  }
}

async function verifyResults(paymentReference) {
  try {
    console.log('🔍 Verifying results in database...\n');

    const TicketPurchase = require('../dist/models/TicketPurchase').default;
    const PaymentTransaction = require('../dist/models/PaymentTransaction').default;

    // Check ticket purchase
    const ticketPurchase = await TicketPurchase.findOne({ paymentReference });
    
    if (!ticketPurchase) {
      console.error('❌ Ticket purchase not found');
      return false;
    }

    console.log('📋 Ticket Purchase Status:');
    console.log(`   Payment Status: ${ticketPurchase.paymentStatus}`);
    console.log(`   Ticket Sent: ${ticketPurchase.ticketSent}`);
    console.log(`   Ticket Sent At: ${ticketPurchase.ticketSentAt || 'Not sent'}`);
    console.log(`   Ticket Numbers: ${ticketPurchase.ticketNumbers.join(', ')}\n`);

    // Check payment transaction
    const transaction = await PaymentTransaction.findOne({ reference: paymentReference });
    
    if (!transaction) {
      console.error('❌ Payment transaction not found');
      return false;
    }

    console.log('💳 Payment Transaction Status:');
    console.log(`   Status: ${transaction.status}`);
    console.log(`   Amount: ₦${transaction.amount.toLocaleString()}`);
    console.log(`   Processed At: ${transaction.processedAt || 'Not processed'}\n`);

    // Verify expected state
    const allGood = 
      ticketPurchase.paymentStatus === 'completed' &&
      ticketPurchase.ticketSent === true &&
      transaction.status === 'successful';

    if (allGood) {
      console.log('✅ All checks passed!\n');
      console.log('Expected results:');
      console.log('   ✅ Payment status: completed');
      console.log('   ✅ Ticket sent: true');
      console.log('   ✅ Transaction status: successful');
      console.log(`   ✅ Email sent to: ${ticketPurchase.email}\n`);
    } else {
      console.log('⚠️ Some checks failed:');
      if (ticketPurchase.paymentStatus !== 'completed') {
        console.log(`   ❌ Payment status is ${ticketPurchase.paymentStatus}, expected completed`);
      }
      if (!ticketPurchase.ticketSent) {
        console.log('   ❌ Ticket not marked as sent');
      }
      if (transaction.status !== 'successful') {
        console.log(`   ❌ Transaction status is ${transaction.status}, expected successful`);
      }
    }

    return allGood;

  } catch (error) {
    console.error('❌ Error verifying results:', error.message);
    return false;
  }
}

async function runTest() {
  let connection;
  
  try {
    console.log('🚀 Starting Ticket Payment Webhook Test\n');
    console.log('=' .repeat(60));
    console.log('\n');

    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    connection = await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Step 1: Create test purchase
    const { paymentReference, amount, email } = await createTestTicketPurchase();

    // Step 2: Send webhook
    const webhookResponse = await sendWebhook(paymentReference, amount);

    // Step 3: Verify results
    const success = await verifyResults(paymentReference);

    console.log('\n' + '=' .repeat(60));
    console.log('\n');

    if (success) {
      console.log('🎉 TEST PASSED! All webhook processing completed successfully.\n');
      console.log('💡 Check your email at:', email);
      console.log('   You should receive a ticket email with QR codes.\n');
    } else {
      console.log('⚠️ TEST COMPLETED WITH WARNINGS\n');
      console.log('Check the logs above for details.\n');
    }

  } catch (error) {
    console.error('\n❌ TEST FAILED\n');
    console.error('Error:', error.message);
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    process.exit(1);
  } finally {
    if (connection) {
      await mongoose.disconnect();
      console.log('✅ Disconnected from MongoDB\n');
    }
  }
}

// Run the test
runTest();

