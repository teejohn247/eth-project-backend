import express from 'express';
import {
  initializePayment,
  verifyPayment,
  getPaymentStatus,
  handlePaymentWebhook,
  refundPayment,
  savePaymentInfo,
  getAllPayments
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

export default router;
