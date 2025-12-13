require('dotenv').config();
const axios = require('axios');

const paymentData = {
    "businessName": "British Council Demo",
    "businessCode": "00000139ZR1667987724",
    "transRef": "TEST_" + Date.now() + "_" + Math.random().toString(36).substring(7),
    "businessRef": "ETH20250000355hvc30",
    "debitedAmount": 5075,
    "transAmount": 5000,
    "transFeeAmount": 75,
    "settlementAmount": 5000,
    "customerId": "aiyudubie.sarah@edotalenthunt.com",
    "transactionDate": "2025-12-13 07:00:46",
    "channelId": 0,
    "currencyCode": "NGN",
    "status": 0,
    "statusMessage": "Successfully processed",
    "metadata": [
        {
            "insightTag": "type",
            "insightTagValue": "vote_payment"
        },
        {
            "insightTag": "contestantId",
            "insightTagValue": "693c0fd83ae2011d37db8fb4"
        },
        {
            "insightTag": "contestantVoteCode",
            "insightTagValue": "CNT-002"
        },
        {
            "insightTag": "contestantName",
            "insightTagValue": "AIYUDUBIE SARAH"
        },
        {
            "insightTag": "votesPurchased",
            "insightTagValue": "50"
        },
        {
            "insightTag": "amountPaid",
            "insightTagValue": "5000"
        }
    ],
    "crn": "000000274038",
    "customerFirstName": "Aiyudubie",
    "customerLastName": "Sarah",
    "customerPhoneNumber": ""
};

const paymentReference = "final_test_" + Date.now(); // Final test with unique reference
const PORT = process.env.PORT || 3001;
const baseURL = process.env.API_URL || `http://localhost:${PORT}`;
const endpoint = `${baseURL}/api/v1/contestants/verify-payment/${paymentReference}`;

async function testVerifyVotePayment() {
  try {
    console.log('🧪 Testing verifyVotePayment endpoint...\n');
    console.log(`📍 Endpoint: ${endpoint}`);
    console.log(`📋 Payment Reference: ${paymentReference}\n`);
    console.log('📤 Sending request...\n');

    const response = await axios.post(endpoint, paymentData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Success! Response received:\n');
    console.log('Status:', response.status);
    console.log('Data:', JSON.stringify(response.data, null, 2));
    
    if (response.data.success) {
      console.log('\n✅ Vote payment verified successfully!');
      console.log(`   Vote ID: ${response.data.data.voteId}`);
      console.log(`   Contestant ID: ${response.data.data.contestantId}`);
      console.log(`   Number of Votes: ${response.data.data.numberOfVotes}`);
      console.log(`   Amount Paid: ₦${response.data.data.amountPaid}`);
    }
  } catch (error) {
    console.error('❌ Error testing endpoint:\n');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.error('No response received. Is the server running?');
      console.error('Request:', error.request);
    } else {
      console.error('Error:', error.message);
    }
    process.exit(1);
  }
}

testVerifyVotePayment();

