require('dotenv').config();
const axios = require('axios');

const webhookPayload = {
    "businessName": "British Council Demo",
    "businessCode": "00000139ZR1667987724",
    "transRef": "webhook_test_" + Date.now(),
    "businessRef": "ETH_WEBHOOK_" + Date.now(),
    "debitedAmount": 5075,
    "transAmount": 5000,
    "transFeeAmount": 75,
    "settlementAmount": 5000,
    "customerId": "aiyudubie.sarah@edotalenthunt.com",
    "transactionDate": new Date().toISOString().replace('T', ' ').substring(0, 19),
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

const PORT = process.env.PORT || 3001;
const baseURL = process.env.API_URL || `http://localhost:${PORT}`;
const endpoint = `${baseURL}/api/v1/payments/webhook`;

async function testWebhook() {
  try {
    console.log('🧪 Testing Payment Webhook...\n');
    console.log(`📍 Endpoint: ${endpoint}`);
    console.log(`📋 Transaction Reference: ${webhookPayload.transRef}\n`);
    console.log('📤 Sending webhook request...\n');

    const response = await axios.post(endpoint, webhookPayload, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Success! Response received:\n');
    console.log('Status:', response.status);
    console.log('Data:', JSON.stringify(response.data, null, 2));
    
    // Wait a moment, then check contestant stats
    console.log('\n⏳ Waiting 2 seconds...\n');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Check contestant stats
    const mongoose = require('mongoose');
    const Contestant = mongoose.model('Contestant', new mongoose.Schema({}, {strict: false}));
    await mongoose.connect(process.env.MONGODB_URI);
    
    const contestant = await Contestant.findById('693c0fd83ae2011d37db8fb4');
    
    console.log('📊 Contestant Stats After Webhook:');
    console.log('   Contestant Number:', contestant.contestantNumber);
    console.log('   Name:', contestant.firstName, contestant.lastName);
    console.log('   Total Votes:', contestant.totalVotes);
    console.log('   Total Vote Amount: ₦' + contestant.totalVoteAmount);
    
    await mongoose.connection.close();

  } catch (error) {
    console.error('❌ Error testing webhook:\n');
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

testWebhook();

