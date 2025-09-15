import express from 'express';
import {
  initializePayment,
  verifyPayment,
  getPaymentStatus,
  handlePaymentWebhook,
  refundPayment
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
router.post('/initialize/:registrationId', authenticateToken, validatePayment, initializePayment);

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

export default router;
