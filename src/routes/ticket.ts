import express from 'express';
import {
  getTickets,
  getTicketByType,
  purchaseTickets,
  verifyTicketPayment,
  getPurchaseDetails
} from '../controllers/ticketController';

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Ticket:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         ticketType:
 *           type: string
 *           enum: [regular, vip, vvip]
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         price:
 *           type: number
 *         currency:
 *           type: string
 *         isActive:
 *           type: boolean
 *         availableQuantity:
 *           type: number
 *         soldQuantity:
 *           type: number
 *     
 *     TicketPurchase:
 *       type: object
 *       properties:
 *         purchaseReference:
 *           type: string
 *         firstName:
 *           type: string
 *         lastName:
 *           type: string
 *         email:
 *           type: string
 *         phone:
 *           type: string
 *         tickets:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               ticketType:
 *                 type: string
 *               quantity:
 *                 type: number
 *               unitPrice:
 *                 type: number
 *               totalPrice:
 *                 type: number
 *         totalAmount:
 *           type: number
 *         currency:
 *           type: string
 *         paymentStatus:
 *           type: string
 *           enum: [pending, processing, completed, failed, refunded]
 *         ticketNumbers:
 *           type: array
 *           items:
 *             type: string
 */

/**
 * @swagger
 * /api/v1/tickets:
 *   get:
 *     summary: Get all available tickets
 *     tags: [Tickets]
 *     responses:
 *       200:
 *         description: Tickets retrieved successfully
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
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Ticket'
 */
router.get('/', getTickets);

/**
 * @swagger
 * /api/v1/tickets/{ticketType}:
 *   get:
 *     summary: Get ticket by type
 *     tags: [Tickets]
 *     parameters:
 *       - in: path
 *         name: ticketType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [regular, vip, vvip]
 *         description: Ticket type
 *     responses:
 *       200:
 *         description: Ticket retrieved successfully
 *       404:
 *         description: Ticket not found
 */
router.get('/:ticketType', getTicketByType);

/**
 * @swagger
 * /api/v1/tickets/purchase:
 *   post:
 *     summary: Purchase tickets
 *     tags: [Tickets]
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
 *               - phone
 *               - tickets
 *             properties:
 *               firstName:
 *                 type: string
 *                 example: "John"
 *               lastName:
 *                 type: string
 *                 example: "Doe"
 *               email:
 *                 type: string
 *                 example: "john.doe@example.com"
 *               phone:
 *                 type: string
 *                 example: "+2348012345678"
 *               tickets:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - ticketType
 *                     - quantity
 *                   properties:
 *                     ticketType:
 *                       type: string
 *                       enum: [regular, vip, vvip]
 *                       example: "regular"
 *                     quantity:
 *                       type: number
 *                       minimum: 1
 *                       example: 2
 *                 example:
 *                   - ticketType: "regular"
 *                     quantity: 2
 *                   - ticketType: "vip"
 *                     quantity: 1
 *     responses:
 *       200:
 *         description: Ticket purchase initialized successfully
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
 *                   type: object
 *                   properties:
 *                     purchaseReference:
 *                       type: string
 *                     paymentReference:
 *                       type: string
 *                     totalAmount:
 *                       type: number
 *                     paymentUrl:
 *                       type: string
 *       400:
 *         description: Invalid request data
 *       404:
 *         description: Ticket not found
 */
router.post('/purchase', purchaseTickets);

/**
 * @swagger
 * /api/v1/tickets/verify-payment/{paymentReference}:
 *   post:
 *     summary: Verify ticket payment and generate tickets
 *     tags: [Tickets]
 *     parameters:
 *       - in: path
 *         name: paymentReference
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
 *             properties:
 *               status:
 *                 type: string
 *                 example: "successful"
 *               transactionId:
 *                 type: string
 *               gateway:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payment verified and tickets generated
 *       404:
 *         description: Payment transaction not found
 */
router.post('/verify-payment/:paymentReference', verifyTicketPayment);

/**
 * @swagger
 * /api/v1/tickets/purchase/{purchaseReference}:
 *   get:
 *     summary: Get ticket purchase details
 *     tags: [Tickets]
 *     parameters:
 *       - in: path
 *         name: purchaseReference
 *         required: true
 *         schema:
 *           type: string
 *         description: Purchase reference
 *     responses:
 *       200:
 *         description: Purchase details retrieved successfully
 *       404:
 *         description: Purchase not found
 */
router.get('/purchase/:purchaseReference', getPurchaseDetails);

export default router;

