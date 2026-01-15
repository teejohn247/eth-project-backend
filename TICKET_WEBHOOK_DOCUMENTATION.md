# Ticket Payment Webhook Implementation

## Overview
Created a dedicated webhook handler for ticket payments similar to the voting webhook, ensuring proper payment verification and ticket delivery.

## New Endpoint
**URL:** `POST /api/v1/payments/ticket-webhook`

## What It Does

1. **Receives Payment Gateway Webhook**
   - Accepts webhooks from payment gateways (Credo, Paystack, etc.)
   - Extracts payment reference from various payload formats
   - Logs all webhook data for debugging

2. **Finds Ticket Purchase**
   - Looks up ticket purchase by payment reference
   - Returns acknowledgment if purchase not found (handles edge cases)
   - Prevents duplicate processing by checking existing payment status

3. **Validates Payment Status**
   - Checks if payment was successful:
     - `event === 'TRANSACTION.SUCCESSFUL'`
     - `status === 0` or `status === '0'`
   - Handles failed payments by updating status and transaction

4. **Updates Payment Records**
   - Updates `TicketPurchase.paymentStatus` to `'completed'`
   - Updates `PaymentTransaction` with:
     - `status: 'successful'`
     - `gatewayResponse: <webhook payload>`
     - `processedAt: <current timestamp>`

5. **Updates Ticket Inventory**
   - Increments `Ticket.soldQuantity` for each ticket type purchased
   - Only updates if this is the first time processing (prevents double-counting)
   - Logs ticket inventory updates

6. **Sends Ticket Email**
   - Checks if email was already sent (`ticketSent` flag)
   - Sends ticket email with:
     - Ticket numbers
     - QR codes (via PDF attachment)
     - Purchase details
   - Updates `ticketSent` flag and `ticketSentAt` timestamp
   - Non-blocking: doesn't fail webhook if email fails

## Database Updates

### TicketPurchase Model
- `paymentStatus`: `'pending'` → `'completed'`
- `ticketSent`: `false` → `true`
- `ticketSentAt`: `null` → `<timestamp>`

### PaymentTransaction Model
- `status`: `'initiated'` → `'successful'`
- `gatewayResponse`: Updated with full webhook payload
- `processedAt`: Set to current timestamp

### Ticket Model
- `soldQuantity`: Incremented by purchased quantity

## Response Format

### Success Response
```json
{
  "success": true,
  "message": "Ticket payment processed successfully",
  "data": {
    "purchaseReference": "TICKET_1234567890_abcdef",
    "paymentReference": "CREDO_REF_123456",
    "ticketNumbers": ["ETH-TKT-001-001", "ETH-TKT-001-002"],
    "email": "customer@example.com",
    "ticketSent": true
  }
}
```

### Already Processed
```json
{
  "success": true,
  "message": "Payment already processed - webhook ignored"
}
```

### Failed Payment
```json
{
  "success": true,
  "message": "Failed payment acknowledged"
}
```

## Error Handling

1. **Missing Reference**: Returns 200 with acknowledgment
2. **Purchase Not Found**: Returns 200 with acknowledgment (graceful handling)
3. **Already Processed**: Returns 200 to prevent retries
4. **Failed Payment**: Updates status to 'failed', returns 200
5. **Email Failure**: Logs error but doesn't fail webhook (non-blocking)
6. **Server Error**: Returns 500 with error details (dev mode only)

## Security Features

- Webhook signature verification can be added (commented out in vote webhook)
- Idempotent processing (prevents duplicate payments)
- Comprehensive logging for audit trail

## Usage Example

### Payment Gateway Webhook Call
```bash
POST https://api.edotalenthunt.com/api/v1/payments/ticket-webhook
Content-Type: application/json

{
  "event": "TRANSACTION.SUCCESSFUL",
  "transRef": "CREDO_REF_123456",
  "data": {
    "status": 0,
    "transAmount": 10000,
    "currencyCode": "NGN",
    "customer": {
      "customerEmail": "customer@example.com"
    }
  }
}
```

## Testing

To test the webhook locally:
```bash
curl -X POST http://localhost:5000/api/v1/payments/ticket-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "event": "TRANSACTION.SUCCESSFUL",
    "transRef": "YOUR_PAYMENT_REFERENCE",
    "data": {
      "status": 0,
      "transAmount": 10000
    }
  }'
```

## Configuration

### Environment Variables
- `MONGODB_URI`: MongoDB connection string
- Email service credentials (for ticket delivery)
- Cloudinary credentials (for image hosting in emails)

## Files Modified

1. **src/controllers/paymentController.ts**
   - Added `handleTicketPaymentWebhook` function (lines 594-733)

2. **src/routes/payment.ts**
   - Added `handleTicketPaymentWebhook` import
   - Added `POST /ticket-webhook` route with Swagger documentation

## Integration with Existing System

- Uses existing `EmailService` for ticket delivery
- Uses existing `TicketPurchase`, `Ticket`, and `PaymentTransaction` models
- Follows same pattern as `handlePaymentWebhook` for consistency
- Non-blocking email sending (same as purchase endpoint)

## Advantages Over Previous Implementation

1. **Reliable Payment Verification**: Webhook ensures payment is processed even if user closes browser
2. **Idempotent Processing**: Prevents duplicate ticket generation and email sending
3. **Comprehensive Logging**: Full audit trail of webhook processing
4. **Graceful Error Handling**: Doesn't fail on email errors, can retry later
5. **Inventory Management**: Automatically updates ticket sold quantities
6. **Gateway Agnostic**: Works with any payment gateway that sends webhooks

## Next Steps

1. Add webhook signature verification for enhanced security
2. Implement webhook retry queue for failed processing
3. Add monitoring/alerting for webhook failures
4. Create admin dashboard to view webhook logs
5. Add support for partial refunds via webhook

