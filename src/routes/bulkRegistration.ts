import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { 
  createBulkRegistration,
  processBulkPayment,
  addParticipant,
  getBulkRegistration,
  listBulkRegistrations
} from '../controllers/bulkRegistrationController';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Bulk Registration
 *   description: Bulk registration management endpoints for purchasing multiple registration slots
 */

/**
 * @swagger
 * /api/v1/bulk-registrations:
 *   post:
 *     summary: Create a new bulk registration
 *     tags: [Bulk Registration]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - totalSlots
 *             properties:
 *               totalSlots:
 *                 type: integer
 *                 minimum: 2
 *                 maximum: 50
 *                 description: Number of registration slots to purchase (all slots are for individual registrations)
 *                 example: 5
 *     responses:
 *       201:
 *         description: Bulk registration created successfully
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
 *                   example: "Bulk registration created successfully. Proceed to payment."
 *                 data:
 *                   type: object
 *                   properties:
 *                     bulkRegistrationId: { type: string }
 *                     bulkRegistrationNumber: { type: string }
 *                     totalSlots: { type: integer }
 *                     pricePerSlot: { type: number }
 *                     totalAmount: { type: number }
 *                     currency: { type: string }
 *                     status: { type: string }
 *                     paymentInfo: { type: object }
 *       400:
 *         description: Invalid slot count
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/', authenticateToken, createBulkRegistration);

/**
 * @swagger
 * /api/v1/bulk-registrations:
 *   get:
 *     summary: List all bulk registrations for the authenticated user
 *     tags: [Bulk Registration]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Bulk registrations retrieved successfully
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
 *                   example: "Bulk registrations retrieved successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       bulkRegistrationId: { type: string }
 *                       bulkRegistrationNumber: { type: string }
 *                       totalSlots: { type: integer }
 *                       usedSlots: { type: integer }
 *                       availableSlots: { type: integer }
 *                       totalAmount: { type: number }
 *                       status: { type: string }
 *                       paymentStatus: { type: string }
 *                       participantCount: { type: integer }
 *                       createdAt: { type: string, format: date-time }
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/', authenticateToken, listBulkRegistrations);

/**
 * @swagger
 * /api/v1/bulk-registrations/{bulkRegistrationId}:
 *   get:
 *     summary: Get bulk registration details by ID
 *     tags: [Bulk Registration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bulkRegistrationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Bulk registration ID
 *     responses:
 *       200:
 *         description: Bulk registration retrieved successfully
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
 *                   example: "Bulk registration retrieved successfully"
 *                 data:
 *                   $ref: '#/components/schemas/BulkRegistration'
 *       404:
 *         description: Bulk registration not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/:bulkRegistrationId', authenticateToken, getBulkRegistration);

/**
 * @swagger
 * /api/v1/bulk-registrations/{bulkRegistrationId}/payment:
 *   post:
 *     summary: Process payment for bulk registration
 *     tags: [Bulk Registration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bulkRegistrationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Bulk registration ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Flexible payment response data from payment gateway
 *             properties:
 *               status:
 *                 type: string
 *                 description: Payment status (0='successful', 1='failed', etc.)
 *                 example: "0"
 *               transAmount:
 *                 type: number
 *                 description: Transaction amount
 *                 example: 5450
 *               reference:
 *                 type: string
 *                 description: Payment reference
 *                 example: "BULK_ETH_123456789"
 *               transactionId:
 *                 type: string
 *                 description: Transaction ID from payment gateway
 *                 example: "txn_abc123def456"
 *               paymentMethod:
 *                 type: string
 *                 description: Payment method used
 *                 example: "card"
 *     responses:
 *       200:
 *         description: Payment processed successfully
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
 *                   example: "Bulk payment processed successfully. You can now add participants."
 *                 data:
 *                   type: object
 *                   properties:
 *                     bulkRegistrationId: { type: string }
 *                     bulkRegistrationNumber: { type: string }
 *                     paymentStatus: { type: string }
 *                     status: { type: string }
 *                     totalSlots: { type: integer }
 *                     availableSlots: { type: integer }
 *                     canAddParticipants: { type: boolean }
 *       404:
 *         description: Bulk registration not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/:bulkRegistrationId/payment', authenticateToken, processBulkPayment);

/**
 * @swagger
 * /api/v1/bulk-registrations/{bulkRegistrationId}/participants:
 *   post:
 *     summary: Add a participant to bulk registration
 *     tags: [Bulk Registration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bulkRegistrationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Bulk registration ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - email
 *             properties:
 *               firstName:
 *                 type: string
 *                 description: Participant's first name
 *                 example: "John"
 *               lastName:
 *                 type: string
 *                 description: Participant's last name
 *                 example: "Doe"
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Participant's email address
 *                 example: "john.doe@example.com"
 *               phoneNo:
 *                 type: string
 *                 description: Participant's phone number (optional)
 *                 example: "+2348012345678"
 *     responses:
 *       201:
 *         description: Participant added successfully
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
 *                   example: "Participant added successfully. Invitation email sent."
 *                 data:
 *                   type: object
 *                   properties:
 *                     bulkRegistrationId: { type: string }
 *                     participantEmail: { type: string }
 *                     participantName: { type: string }
 *                     availableSlots: { type: integer }
 *                     usedSlots: { type: integer }
 *                     totalSlots: { type: integer }
 *       400:
 *         description: Validation error or no available slots
 *       404:
 *         description: Bulk registration not found or not active
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/:bulkRegistrationId/participants', authenticateToken, addParticipant);

/**
 * @swagger
 * components:
 *   schemas:
 *     BulkRegistration:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Bulk registration ID
 *         ownerId:
 *           type: string
 *           description: ID of the user who purchased the bulk registration
 *         bulkRegistrationNumber:
 *           type: string
 *           description: Unique bulk registration number
 *         totalSlots:
 *           type: integer
 *           description: Total number of registration slots purchased
 *         usedSlots:
 *           type: integer
 *           description: Number of slots that have been used/assigned
 *         availableSlots:
 *           type: integer
 *           description: Number of slots still available
 *         pricePerSlot:
 *           type: number
 *           description: Price per registration slot
 *         totalAmount:
 *           type: number
 *           description: Total amount paid for all slots
 *         currency:
 *           type: string
 *           description: Currency used for payment
 *         paymentInfo:
 *           type: object
 *           properties:
 *             paymentStatus:
 *               type: string
 *               enum: [pending, processing, completed, failed, refunded]
 *             paymentReference:
 *               type: string
 *             transactionId:
 *               type: string
 *             paymentMethod:
 *               type: string
 *             paidAt:
 *               type: string
 *               format: date-time
 *         participants:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               participantId:
 *                 type: string
 *                 description: Reference to User model when they complete registration
 *               registrationId:
 *                 type: string
 *                 description: Reference to Registration model
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *               phoneNo:
 *                 type: string
 *               invitationStatus:
 *                 type: string
 *                 enum: [pending, sent, accepted, registered, completed]
 *               invitationSentAt:
 *                 type: string
 *                 format: date-time
 *               registeredAt:
 *                 type: string
 *                 format: date-time
 *               addedAt:
 *                 type: string
 *                 format: date-time
 *         status:
 *           type: string
 *           enum: [draft, payment_pending, active, completed, expired]
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

export default router;
