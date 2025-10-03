import express from 'express';
import {
  initializePayment,
  verifyPayment,
  getPaymentStatus,
  handlePaymentWebhook,
  refundPayment,
  savePaymentInfo,
  getAllPayments,
  updatePaymentTransaction,
  createTransaction
} from '../controllers/paymentController';
import { authenticateToken, requireRole } from '../middleware/auth';
import { validatePayment } from '../middleware/validation';

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     PaymentInit:
 *       type: object
 *       properties:
 *         reference:
 *           type: string
 *           example: "ETH_1632345678_abc123def"
 *         authorization_url:
 *           type: string
 *           example: "https://checkout.paystack.com/ETH_1632345678_abc123def"
 *         amount:
 *           type: number
 *           example: 1090
 *         currency:
 *           type: string
 *           example: "NGN"
 *     
 *     PaymentStatus:
 *       type: object
 *       properties:
 *         paymentStatus:
 *           type: string
 *           enum: [pending, processing, completed, failed, refunded]
 *         amount:
 *           type: number
 *         currency:
 *           type: string
 *         reference:
 *           type: string
 *         paidAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/v1/payments/initialize/{registrationId}:
 *   post:
 *     summary: Initialize payment for registration
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: registrationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Registration ID
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *                 default: 1090
 *               currency:
 *                 type: string
 *                 default: "NGN"
 *     responses:
 *       200:
 *         description: Payment initialized successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/PaymentInit'
 *       400:
 *         description: Payment already completed
 *       404:
 *         description: Registration not found
 */
router.post('/initialize/:registrationId', authenticateToken, initializePayment);

/**
 * @swagger
 * /api/v1/payments/verify/{reference}:
 *   post:
 *     summary: Verify payment using reference
 *     tags: [Payments]
 *     parameters:
 *       - in: path
 *         name: reference
 *         required: true
 *         schema:
 *           type: string
 *         description: Payment reference
 *     responses:
 *       200:
 *         description: Payment verified successfully
 *       400:
 *         description: Payment verification failed
 *       404:
 *         description: Transaction not found
 */
router.post('/verify/:reference', verifyPayment);

/**
 * @swagger
 * /api/v1/payments/status/{registrationId}:
 *   get:
 *     summary: Get payment status for registration
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: registrationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Registration ID
 *     responses:
 *       200:
 *         description: Payment status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/PaymentStatus'
 *       404:
 *         description: Registration not found
 */
router.get('/status/:registrationId', authenticateToken, getPaymentStatus);

/**
 * @swagger
 * /api/v1/payments/webhook:
 *   post:
 *     summary: Payment gateway webhook endpoint
 *     tags: [Payments]
 *     description: Endpoint for payment gateway webhooks (Paystack, Credo, etc.)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Webhook payload from payment gateway
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 *       400:
 *         description: Invalid webhook signature
 */
router.post('/webhook', handlePaymentWebhook);

/**
 * @swagger
 * /api/v1/payments/refund/{reference}:
 *   post:
 *     summary: Refund payment (Admin only)
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reference
 *         required: true
 *         schema:
 *           type: string
 *         description: Payment reference
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reason
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Reason for refund
 *     responses:
 *       200:
 *         description: Payment refunded successfully
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Transaction not found
 */
router.post('/refund/:reference', authenticateToken, requireRole('admin'), refundPayment);

/**
 * @swagger
 * /api/v1/payments/save-info/{registrationId}:
 *   post:
 *     summary: Save flexible payment information from frontend
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: registrationId
 *         required: false
 *         schema:
 *           type: string
 *         description: Registration ID (optional - can use userId in body or authenticated user's registration)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Flexible payment data structure - accepts any payment gateway response
 *             properties:
 *               userId:
 *                 type: string
 *                 description: User ID (alternative to registrationId parameter)
 *                 example: "64b5f2a5e123456789abcdef"
 *               reference:
 *                 type: string
 *                 description: Payment reference
 *                 example: "PAY_123456789"
 *               amount:
 *                 type: number
 *                 description: Payment amount
 *                 example: 1090
 *               currency:
 *                 type: string
 *                 description: Payment currency
 *                 example: "NGN"
 *               status:
 *                 type: string
 *                 description: Payment status
 *                 example: "successful"
 *               transactionId:
 *                 type: string
 *                 description: Gateway transaction ID
 *                 example: "1234567890"
 *               paymentMethod:
 *                 type: string
 *                 description: Payment method used
 *                 example: "card"
 *               gateway:
 *                 type: string
 *                 description: Payment gateway used
 *                 example: "paystack"
 *               email:
 *                 type: string
 *                 description: Customer email
 *                 example: "user@example.com"
 *             additionalProperties: true
 *             example:
 *               userId: "64b5f2a5e123456789abcdef"
 *               reference: "PAY_123456789"
 *               amount: 1090
 *               currency: "NGN"
 *               status: "successful"
 *               transactionId: "1234567890"
 *               paymentMethod: "card"
 *               gateway: "paystack"
 *               email: "user@example.com"
 *               gatewayResponse:
 *                 channel: "card"
 *                 bank: "Test Bank"
 *                 card_type: "visa"
 *                 authorization_code: "AUTH_123"
 *               metadata:
 *                 custom_field: "custom_value"
 *     responses:
 *       200:
 *         description: Payment information saved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Payment information saved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     registrationId:
 *                       type: string
 *                     paymentReference:
 *                       type: string
 *                     paymentStatus:
 *                       type: string
 *                     amount:
 *                       type: number
 *                     currency:
 *                       type: string
 *                     transactionId:
 *                       type: string
 *                     currentStep:
 *                       type: number
 *                     completedSteps:
 *                       type: array
 *                       items:
 *                         type: number
 *                     registrationStatus:
 *                       type: string
 *                     savedData:
 *                       type: object
 *                       description: The original payment data that was saved
 *       400:
 *         description: Payment data is required
 *       404:
 *         description: Registration not found
 *       500:
 *         description: Server error
 */
// Route with optional registrationId parameter
router.post('/save-info/:registrationId?', authenticateToken, savePaymentInfo);

// Alternative route without any parameters for pure body-based usage
router.post('/save-info', authenticateToken, savePaymentInfo);

/**
 * @swagger
 * /api/v1/payments:
 *   get:
 *     summary: Get authenticated user's payment transactions with filtering and pagination
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [initiated, pending, successful, failed, cancelled, refunded]
 *         description: Filter by payment status
 *       - in: query
 *         name: paymentMethod
 *         schema:
 *           type: string
 *         description: Filter by payment method
 *       - in: query
 *         name: currency
 *         schema:
 *           type: string
 *           default: NGN
 *         description: Filter by currency
 *       - in: query
 *         name: registrationId
 *         schema:
 *           type: string
 *         description: Filter by registration ID
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter payments from this date (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter payments until this date (YYYY-MM-DD)
 *       - in: query
 *         name: amountMin
 *         schema:
 *           type: number
 *         description: Minimum amount filter
 *       - in: query
 *         name: amountMax
 *         schema:
 *           type: number
 *         description: Maximum amount filter
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in payment reference or gateway reference
 *     responses:
 *       200:
 *         description: Payment transactions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Payment transactions retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     payments:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           registrationId:
 *                             type: object
 *                             properties:
 *                               registrationNumber:
 *                                 type: string
 *                               registrationType:
 *                                 type: string
 *                               status:
 *                                 type: string
 *                           userId:
 *                             type: object
 *                             properties:
 *                               firstName:
 *                                 type: string
 *                               lastName:
 *                                 type: string
 *                               email:
 *                                 type: string
 *                           reference:
 *                             type: string
 *                           amount:
 *                             type: number
 *                           currency:
 *                             type: string
 *                           status:
 *                             type: string
 *                           paymentMethod:
 *                             type: string
 *                           gatewayReference:
 *                             type: string
 *                           processedAt:
 *                             type: string
 *                             format: date-time
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                           gatewayResponse:
 *                             type: object
 *                             description: Complete gateway response data
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         currentPage:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *                         totalCount:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         hasNextPage:
 *                           type: boolean
 *                         hasPrevPage:
 *                           type: boolean
 *                     filters:
 *                       type: object
 *                       description: Applied filters for reference
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/', authenticateToken, getAllPayments);

/**
 * @swagger
 * /api/v1/payments/update/{reference}:
 *   put:
 *     summary: Update payment transaction (Admin only)
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reference
 *         required: true
 *         schema:
 *           type: string
 *         description: Payment reference
 *         example: "ETH_1632345678_abc123def"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [initiated, pending, successful, failed, cancelled, refunded]
 *                 description: Update transaction status
 *                 example: "successful"
 *               amount:
 *                 type: number
 *                 description: Update transaction amount
 *                 example: 1090
 *               currency:
 *                 type: string
 *                 description: Update currency
 *                 example: "NGN"
 *               paymentMethod:
 *                 type: string
 *                 description: Update payment method
 *                 example: "card"
 *               gatewayReference:
 *                 type: string
 *                 description: Update gateway reference/transaction ID
 *                 example: "1234567890"
 *               failureReason:
 *                 type: string
 *                 description: Reason for failure (if status is failed)
 *                 example: "Insufficient funds"
 *               gatewayResponse:
 *                 type: object
 *                 description: Additional gateway response data to merge
 *                 additionalProperties: true
 *                 example:
 *                   channel: "card"
 *                   bank: "Test Bank"
 *                   card_type: "visa"
 *               notes:
 *                 type: string
 *                 description: Admin notes for this update
 *                 example: "Manually updated payment status after gateway confirmation"
 *             example:
 *               status: "successful"
 *               amount: 1090
 *               currency: "NGN"
 *               paymentMethod: "card"
 *               gatewayReference: "1234567890"
 *               notes: "Payment confirmed manually after gateway issue"
 *     responses:
 *       200:
 *         description: Payment transaction updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Payment transaction updated successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     transactionId:
 *                       type: string
 *                       example: "64b5f2a5e123456789abcdef"
 *                     reference:
 *                       type: string
 *                       example: "ETH_1632345678_abc123def"
 *                     status:
 *                       type: string
 *                       example: "successful"
 *                     amount:
 *                       type: number
 *                       example: 1090
 *                     currency:
 *                       type: string
 *                       example: "NGN"
 *                     paymentMethod:
 *                       type: string
 *                       example: "card"
 *                     gatewayReference:
 *                       type: string
 *                       example: "1234567890"
 *                     processedAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-01-01T12:00:00.000Z"
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-01-01T12:05:00.000Z"
 *                     changes:
 *                       type: object
 *                       description: Fields that were changed in this update
 *                       example:
 *                         status: "successful"
 *                         gatewayReference: "1234567890"
 *                         adminNotes: "added"
 *                     oldValues:
 *                       type: object
 *                       description: Previous values of changed fields
 *                       example:
 *                         status: "pending"
 *                         gatewayReference: null
 *       400:
 *         description: Update data is required
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Transaction not found
 *       500:
 *         description: Server error
 */
router.put('/update/:reference', authenticateToken, requireRole('admin'), updatePaymentTransaction);

/**
 * @swagger
 * /api/v1/payments/create/{registrationId}:
 *   post:
 *     summary: Create transaction from frontend payload (Admin only)
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: registrationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Registration ID for which to create the transaction
 *         example: "64b5f2a5e123456789abcdef"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Transaction payload from frontend/payment gateway
 *             properties:
 *               reference:
 *                 type: string
 *                 description: Payment reference (will be generated if not provided)
 *                 example: "ETH_1632345678_abc123def"
 *               amount:
 *                 type: number
 *                 description: Transaction amount
 *                 example: 1090
 *               transAmount:
 *                 type: string
 *                 description: Transaction amount (alternative field used by some gateways)
 *                 example: "1090"
 *               currency:
 *                 type: string
 *                 description: Currency code
 *                 default: "NGN"
 *                 example: "NGN"
 *               status:
 *                 type: string
 *                 description: Transaction status
 *                 enum: [pending, initiated, successful, success, completed, failed, failure, error, cancelled, canceled, "0", "1"]
 *                 example: "successful"
 *               paymentMethod:
 *                 type: string
 *                 description: Payment method used
 *                 example: "card"
 *               gateway:
 *                 type: string
 *                 description: Payment gateway used
 *                 example: "paystack"
 *               transactionId:
 *                 type: string
 *                 description: Gateway transaction ID
 *                 example: "1234567890"
 *               gatewayReference:
 *                 type: string
 *                 description: Gateway reference (alternative to transactionId)
 *                 example: "GATEWAY_REF_123"
 *               email:
 *                 type: string
 *                 description: Customer email
 *                 example: "user@example.com"
 *             additionalProperties: true
 *             example:
 *               reference: "ETH_1632345678_abc123def"
 *               transAmount: "1090"
 *               currency: "NGN"
 *               status: "0"
 *               paymentMethod: "card"
 *               gateway: "paystack"
 *               transactionId: "1234567890"
 *               email: "user@example.com"
 *               metadata:
 *                 custom_field: "custom_value"
 *     responses:
 *       201:
 *         description: Transaction created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Transaction created successfully. Payment completed."
 *                 data:
 *                   type: object
 *                   properties:
 *                     transactionId:
 *                       type: string
 *                       example: "64b5f2a5e123456789abcdef"
 *                     reference:
 *                       type: string
 *                       example: "ETH_1632345678_abc123def"
 *                     status:
 *                       type: string
 *                       example: "successful"
 *                     amount:
 *                       type: number
 *                       example: 1090
 *                     currency:
 *                       type: string
 *                       example: "NGN"
 *                     paymentMethod:
 *                       type: string
 *                       example: "card"
 *                     gatewayReference:
 *                       type: string
 *                       example: "1234567890"
 *                     registrationId:
 *                       type: string
 *                       example: "64b5f2a5e123456789abcdef"
 *                     registrationStatus:
 *                       type: string
 *                       example: "submitted"
 *                     currentStep:
 *                       type: number
 *                       example: 8
 *                     completedSteps:
 *                       type: array
 *                       items:
 *                         type: number
 *                       example: [1, 2, 3, 4, 5, 6, 7, 8]
 *                     paymentStatus:
 *                       type: string
 *                       example: "completed"
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-01-01T12:00:00.000Z"
 *                     processedAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-01-01T12:00:00.000Z"
 *                     bulkRegistration:
 *                       type: object
 *                       description: Bulk registration info (only for bulk registrations)
 *                       properties:
 *                         bulkRegistrationId:
 *                           type: string
 *                         bulkRegistrationNumber:
 *                           type: string
 *                         totalSlots:
 *                           type: number
 *                         usedSlots:
 *                           type: number
 *                         availableSlots:
 *                           type: number
 *                         status:
 *                           type: string
 *                         canAddParticipants:
 *                           type: boolean
 *                         nextStep:
 *                           type: string
 *       400:
 *         description: Transaction data is required
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Registration not found
 *       409:
 *         description: Transaction with this reference already exists
 *       500:
 *         description: Server error
 */
router.post('/create/:registrationId', authenticateToken, requireRole('admin'), createTransaction);

export default router;
