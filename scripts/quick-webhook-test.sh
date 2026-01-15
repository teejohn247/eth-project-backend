#!/bin/bash

echo "🧪 Quick Ticket Webhook Test"
echo "================================"
echo ""

# Create a test purchase and get the reference
echo "📝 Step 1: Find or create a ticket purchase..."
echo ""

# Test the webhook with a simple curl
echo "📤 Step 2: Sending test webhook..."
echo ""

curl -X POST http://localhost:3001/api/v1/payments/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "event": "TRANSACTION.SUCCESSFUL",
    "transRef": "TEST_REF_12345",
    "status": 0,
    "data": {
      "status": 0,
      "transRef": "TEST_REF_12345",
      "transAmount": 10000,
      "currencyCode": "NGN",
      "customer": {
        "customerEmail": "test@example.com"
      }
    }
  }' | jq '.'

echo ""
echo ""
echo "✅ Test complete!"
echo ""
echo "To test with a real purchase:"
echo "1. Run: node scripts/find-pending-purchases.js"
echo "2. Copy a payment reference"
echo "3. Run: node scripts/test-webhook-simple.js <PAYMENT_REFERENCE>"

