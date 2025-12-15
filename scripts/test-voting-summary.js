require('dotenv').config();
const axios = require('axios');

const PORT = process.env.PORT || 3001;
const baseURL = process.env.API_URL || `http://localhost:${PORT}`;
const endpoint = `${baseURL}/api/v1/contestants/votes/summary`;

async function testVotingSummary() {
  try {
    console.log('🧪 Testing Voting Summary endpoint...\n');
    console.log(`📍 Endpoint: ${endpoint}\n`);
    console.log('📤 Sending request...\n');

    const response = await axios.get(endpoint);

    console.log('✅ Success! Response received:\n');
    console.log(JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('❌ Error testing endpoint:\n');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.error('No response received. Is the server running?');
    } else {
      console.error('Error:', error.message);
    }
    process.exit(1);
  }
}

testVotingSummary();

