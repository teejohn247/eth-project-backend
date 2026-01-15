# Testing the Ticket Payment Webhook

You have 3 ways to test the webhook:

## Method 1: Full Automated Test (Creates Test Purchase + Sends Webhook)

**Start your server first:**
```bash
npm run dev
# Or in production:
npm start
```

**Then run the test:**
```bash
node scripts/test-ticket-webhook.js
```

This will:
1. ✅ Create a test ticket purchase in the database
2. ✅ Create a payment transaction
3. ✅ Send a webhook to your server
4. ✅ Verify all database updates
5. ✅ Check if email was sent

**Expected Output:**
```
🎉 TEST PASSED! All webhook processing completed successfully.

💡 Check your email at: teejohn247@gmail.com
   You should receive a ticket email with QR codes.
```

---

## Method 2: Test with Existing Purchase

**Step 1: Find pending purchases**
```bash
node scripts/find-pending-purchases.js
```

This shows all pending ticket purchases with their payment references.

**Step 2: Test webhook with a specific reference**
```bash
node scripts/test-webhook-simple.js <PAYMENT_REFERENCE>
```

Example:
```bash
node scripts/test-webhook-simple.js CREDO_1234567890
```

---

## Method 3: Manual cURL Test

**Start your server**, then use cURL:

```bash
curl -X POST http://localhost:3001/api/v1/payments/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "event": "TRANSACTION.SUCCESSFUL",
    "transRef": "YOUR_PAYMENT_REFERENCE_HERE",
    "status": 0,
    "data": {
      "status": 0,
      "transRef": "YOUR_PAYMENT_REFERENCE_HERE",
      "transAmount": 20000,
      "currencyCode": "NGN",
      "paymentMethod": "card",
      "channelId": "1",
      "responseMessage": "Approved",
      "customer": {
        "customerEmail": "teejohn247@gmail.com",
        "firstName": "Test",
        "lastName": "Customer"
      }
    }
  }'
```

Replace `YOUR_PAYMENT_REFERENCE_HERE` with an actual payment reference from your database.

---

## Method 4: Quick Shell Script

```bash
./scripts/quick-webhook-test.sh
```

This sends a simple test webhook to verify the endpoint is responding.

---

**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "event": "TRANSACTION.SUCCESSFUL",
  "transRef": "YOUR_PAYMENT_REFERENCE",
  "status": 0,
  "data": {
    "status": 0,
    "transRef": "YOUR_PAYMENT_REFERENCE",
    "transAmount": 20000,
    "currencyCode": "NGN",
    "paymentMethod": "card",
    "channelId": "1",
    "responseMessage": "Approved",
    "customer": {
      "customerEmail": "teejohn247@gmail.com",
      "firstName": "Test",
      "lastName": "Customer",
      "phoneNo": "08161582774"
    }
  }
}
```

---

## What to Expect

### Successful Webhook Response:
```json
{
  "success": true,
  "message": "Ticket payment processed successfully",
  "data": {
    "purchaseReference": "TICKET_1234567890_abcdef",
    "paymentReference": "CREDO_TEST_1768465616651",
    "ticketNumbers": ["ETH-TKT-TEST-001", "ETH-TKT-TEST-002"],
    "email": "teejohn247@gmail.com",
    "ticketSent": true
  }
}
```

### Already Processed:
```json
{
  "success": true,
  "message": "Payment already processed - webhook ignored"
}
```

### Purchase Not Found:
```json
{
  "success": true,
  "message": "Ticket purchase not found - webhook acknowledged"
}
```

---

## Verifying Results

### Check Database:
```bash
# Connect to MongoDB
mongosh "<YOUR_MONGODB_URI>"

# Check ticket purchase
db.ticketpurchases.findOne({ paymentReference: "YOUR_REFERENCE" })

# Should show:
# - paymentStatus: "completed"
# - ticketSent: true
# - ticketSentAt: <timestamp>

# Check payment transaction
db.paymenttransactions.findOne({ reference: "YOUR_REFERENCE" })

# Should show:
# - status: "successful"
# - processedAt: <timestamp>
```

### Check Email:
- Look for email at: `teejohn247@gmail.com`
- Subject: "Your Edo Talent Hunt Tickets"
- Should contain ticket numbers and QR codes

### Check Server Logs:
Look for these log messages:
```
📥 Ticket payment webhook received: ...
✅ Payment successful - processing ticket purchase...
✅ Payment transaction updated
✅ Updated ticket regular: +2 sold
✅ Ticket email sent to teejohn247@gmail.com
✅ Ticket payment processed successfully
```

---

## Troubleshooting

### Server Not Running (403/Connection Refused)
```bash
# Start the server
npm run dev
# Or
npm start
```

### No Pending Purchases
```bash
# Create a test purchase first
node scripts/test-ticket-webhook.js
```

### Email Not Sending
Check your `.env` file has:
```env
EMAIL_HOST=smtp-relay.brevo.com
EMAIL_PORT=465
EMAIL_USER=your-email
BREVO_SMTP_KEY=your-key
EMAIL_FROM=edotalenthunt@themakersacad.com
LOGO_IMAGE_URL=https://res.cloudinary.com/dbwtjruq8/image/upload/v1768407909/edo-talent-hunt/email/edo-logo.png
PERFORMERS_IMAGE_URL=https://res.cloudinary.com/dbwtjruq8/image/upload/v1768391085/edo-talent-hunt/email/performers-collage.jpg
```

### Webhook Returns 500
- Check server logs for detailed error
- Ensure MongoDB is connected
- Verify payment reference exists in database

---

## Production Testing

### Test with Real Payment Gateway

Configure your payment gateway (Credo/Paystack) webhook URL to:
```
https://your-domain.com/api/v1/payments/webhook
```

The gateway will automatically send webhooks for real transactions.

### Webhook Signature Verification (Optional)

Currently disabled for testing. To enable:

1. Uncomment signature verification in `src/controllers/paymentController.ts`:
```typescript
const signature = req.headers['x-signature'] as string;
if (!signature) {
  res.status(401).json({ success: false, message: 'No signature provided' });
  return;
}
```

2. Add your gateway's signature verification logic

---

## Quick Start

**If server is running:**
```bash
# Full test (creates purchase + sends webhook)
node scripts/test-ticket-webhook.js
```

**If server is NOT running:**
```bash
# Terminal 1: Build and start server
npm run build
npm start
# Wait for "Server is running on port 3001"

# Terminal 2: Run test
node scripts/test-ticket-webhook.js
```

That's it! 🚀

