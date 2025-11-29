require('dotenv').config();
const axios = require('axios');

const BASE_URL = process.env.API_URL || 'http://localhost:3001/api/v1';

async function testTicketPurchaseFlow() {
  try {
    console.log('🧪 Testing Complete Ticket Purchase Flow\n');

    // Step 1: Purchase tickets
    console.log('1️⃣ Purchasing tickets...');
    const purchaseData = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'teejohn247@gmail.com',
      phone: '+2348012345678',
      tickets: [
        {
          ticketType: 'regular',
          quantity: 1
        }
      ]
    };

    const purchaseResponse = await axios.post(`${BASE_URL}/tickets/purchase`, purchaseData);
    
    if (!purchaseResponse.data.success) {
      console.error('❌ Purchase failed:', purchaseResponse.data.message);
      process.exit(1);
    }

    const { purchaseReference, paymentReference } = purchaseResponse.data.data;
    console.log('✅ Purchase successful!');
    console.log('   Purchase Reference:', purchaseReference);
    console.log('   Payment Reference:', paymentReference);
    console.log('   Total Amount:', purchaseResponse.data.data.totalAmount);
    console.log('');

    // Step 2: Verify payment (simulate successful payment)
    console.log('2️⃣ Verifying payment...');
    const verifyData = {
      status: 'successful',
      transactionId: 'TEST_TXN_' + Date.now(),
      gateway: 'test'
    };

    const verifyResponse = await axios.post(
      `${BASE_URL}/tickets/verify-payment/${paymentReference}`,
      verifyData
    );

    if (!verifyResponse.data.success) {
      console.error('❌ Payment verification failed:', verifyResponse.data.message);
      process.exit(1);
    }

    console.log('✅ Payment verified successfully!');
    console.log('   Ticket Numbers:', verifyResponse.data.data.ticketNumbers);
    console.log('   Email Sent:', verifyResponse.data.data.ticketSent);
    console.log('   Email:', verifyResponse.data.data.email);
    console.log('');

    // Step 3: Get purchase details
    console.log('3️⃣ Retrieving purchase details...');
    const detailsResponse = await axios.get(`${BASE_URL}/tickets/purchase/${purchaseReference}`);
    
    if (detailsResponse.data.success) {
      console.log('✅ Purchase details retrieved!');
      console.log('   Status:', detailsResponse.data.data.paymentStatus);
      console.log('   Ticket Count:', detailsResponse.data.data.tickets.length);
      console.log('   Total Tickets:', detailsResponse.data.data.tickets.reduce((sum, t) => sum + t.quantity, 0));
    }

    console.log('\n🎉 Complete flow test successful!');
    console.log('📬 Check your email at teejohn247@gmail.com for the ticket PDF');
    
  } catch (error) {
    console.error('\n❌ Test failed!');
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Message:', error.response.data.message || error.response.data.error);
      if (error.response.data.error) {
        console.error('   Error details:', JSON.stringify(error.response.data.error, null, 2));
      }
    } else {
      console.error('   Error:', error.message);
    }
    process.exit(1);
  }
}

testTicketPurchaseFlow();

