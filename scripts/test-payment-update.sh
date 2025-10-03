#!/bin/bash

# Test script for the new payment transaction update endpoint
# Usage: ./test-payment-update.sh

echo "🧪 Testing Payment Transaction Update Endpoint"
echo "=============================================="

# Base URL
BASE_URL="http://localhost:3001/api/v1"

# Admin token (you'll need to replace this with a valid admin token)
ADMIN_TOKEN="your-admin-token-here"

# Test transaction ID (you'll need to replace this with a real transaction ID)
TRANSACTION_ID="your-transaction-id-here"

echo ""
echo "📋 Test Cases:"
echo "1. Update transaction status to successful"
echo "2. Update transaction amount and currency"
echo "3. Add admin notes"
echo "4. Update multiple fields at once"
echo ""

# Test 1: Update status to successful
echo "🔄 Test 1: Updating transaction status to successful..."
curl -s -X PUT "${BASE_URL}/payments/update/${TRANSACTION_ID}" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -d '{
    "status": "successful",
    "notes": "Payment confirmed manually after gateway verification"
  }' | jq '.' || echo "❌ Test 1 failed"

echo ""

# Test 2: Update amount and currency
echo "🔄 Test 2: Updating transaction amount and currency..."
curl -s -X PUT "${BASE_URL}/payments/update/${TRANSACTION_ID}" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -d '{
    "amount": 1200,
    "currency": "USD",
    "notes": "Amount corrected due to currency conversion"
  }' | jq '.' || echo "❌ Test 2 failed"

echo ""

# Test 3: Update gateway information
echo "🔄 Test 3: Updating gateway reference and payment method..."
curl -s -X PUT "${BASE_URL}/payments/update/${TRANSACTION_ID}" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -d '{
    "gatewayReference": "PAY_123456789",
    "paymentMethod": "bank_transfer",
    "gatewayResponse": {
      "channel": "bank_transfer",
      "bank": "First Bank",
      "account_name": "John Doe"
    },
    "notes": "Updated with correct gateway information"
  }' | jq '.' || echo "❌ Test 3 failed"

echo ""

# Test 4: Update to failed status with failure reason
echo "🔄 Test 4: Updating transaction to failed status..."
curl -s -X PUT "${BASE_URL}/payments/update/${TRANSACTION_ID}" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -d '{
    "status": "failed",
    "failureReason": "Insufficient funds",
    "notes": "Payment failed due to insufficient account balance"
  }' | jq '.' || echo "❌ Test 4 failed"

echo ""
echo "✅ Test script completed!"
echo ""
echo "📝 Notes:"
echo "- Replace ADMIN_TOKEN with a valid admin JWT token"
echo "- Replace TRANSACTION_ID with a real transaction ID or reference"
echo "- The endpoint accepts both transaction ObjectId and payment reference"
echo "- Only admin users can access this endpoint"

