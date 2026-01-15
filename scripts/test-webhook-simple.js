/**
 * Simple Webhook Test - Using Existing Purchase
 * 
 * This script tests the webhook with an existing ticket purchase.
 * Usage: node scripts/test-webhook-simple.js <PAYMENT_REFERENCE>
 */

require('dotenv').config();
const axios = require('axios');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';

// Get payment reference from command line argument
const paymentReference = process.argv[2];

if (!paymentReference) {
  console.error('❌ Please provide a payment reference');
  console.log('\nUsage: node scripts/test-webhook-simple.js <PAYMENT_REFERENCE>');
  console.log('Example: node scripts/test-webhook-simple.js CREDO_1234567890\n');
  process.exit(1);
}

async function testWebhook() {
  try {
    console.log('🚀 Testing Ticket Payment Webhook\n');
    console.log(`Payment Reference: ${paymentReference}\n`);

    // Simulate Credo webhook payload
    const webhookPayload = {
      event: 'TRANSACTION.SUCCESSFUL',
      transRef: paymentReference,
      reference: paymentReference,
      status: 0, // 0 = success
      data: {
        status: 0,
        transRef: paymentReference,
        transAmount: 20000, // You can adjust this
        currencyCode: 'NGN',
        paymentMethod: 'card',
        channelId: '1',
        responseMessage: 'Approved',
        customer: {
          customerEmail: 'teejohn247@gmail.com',
          firstName: 'Test',
          lastName: 'Customer',
          phoneNo: '08161582774'
        }
      }
    };

    console.log('📤 Sending webhook...\n');

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

    if (response.data.success) {
      console.log('🎉 Webhook processed successfully!');
      if (response.data.data) {
        console.log('\n📋 Results:');
        console.log(`   Purchase Reference: ${response.data.data.purchaseReference || 'N/A'}`);
        console.log(`   Ticket Sent: ${response.data.data.ticketSent || 'N/A'}`);
        console.log(`   Email: ${response.data.data.email || 'N/A'}`);
        if (response.data.data.ticketNumbers) {
          console.log(`   Ticket Numbers: ${response.data.data.ticketNumbers.join(', ')}`);
        }
      }
    }

  } catch (error) {
    if (error.response) {
      console.error('❌ Webhook failed:');
      console.error('Status:', error.response.status);
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('❌ Error:', error.message);
    }
    process.exit(1);
  }
}

testWebhook();

