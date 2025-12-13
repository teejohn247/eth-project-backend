import express from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import {
  promoteToContestant,
  getContestants,
  getContestant,
  voteForContestant,
  verifyVotePayment,
  getContestantVotes,
  getAllVotes
} from '../controllers/contestantController';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Contestants
 *   description: Contestant management and voting endpoints
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Contestant:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Contestant ID
 *         contestantNumber:
 *           type: string
 *           description: Unique contestant identifier
 *           example: "CNT123456789"
 *         userId:
 *           type: string
 *           description: Reference to User ID
 *         registrationId:
 *           type: string
 *           description: Reference to Registration ID
 *         firstName:
 *           type: string
 *           description: Contestant first name
 *         lastName:
 *           type: string
 *           description: Contestant last name
 *         email:
 *           type: string
 *           format: email
 *           description: Contestant email
 *         phoneNo:
 *           type: string
 *           description: Contestant phone number
 *         talentCategory:
 *           type: string
 *           enum: [Singing, Dancing, Acting, Comedy, Drama, Instrumental, Other]
 *           description: Talent category
 *         stageName:
 *           type: string
 *           description: Stage name
 *         status:
 *           type: string
 *           enum: [active, inactive, eliminated, winner]
 *           description: Contestant status
 *         isQualified:
 *           type: boolean
 *           description: Whether contestant is qualified
 *         totalVotes:
 *           type: number
 *           description: Total number of votes received
 *         totalVoteAmount:
 *           type: number
 *           description: Total amount paid for votes
 *         registrationNumber:
 *           type: string
 *           description: Registration number
 *         registrationType:
 *           type: string
 *           enum: [individual, group, bulk]
 *           description: Registration type
 *     
 *     Vote:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Vote ID
 *         contestantId:
 *           type: string
 *           description: Reference to Contestant ID
 *         contestantEmail:
 *           type: string
 *           format: email
 *           description: Contestant email
 *         numberOfVotes:
 *           type: number
 *           description: Number of votes
 *         amountPaid:
 *           type: number
 *           description: Amount paid for votes
 *         currency:
 *           type: string
 *           default: "NGN"
 *         voterInfo:
 *           type: object
 *           properties:
 *             firstName:
 *               type: string
 *             lastName:
 *               type: string
 *             email:
 *               type: string
 *             phone:
 *               type: string
 *         paymentReference:
 *           type: string
 *           description: Payment reference
 *         paymentStatus:
 *           type: string
 *           enum: [pending, processing, completed, failed, refunded]
 *           description: Payment status
 *         paymentMethod:
 *           type: string
 *           description: Payment method used
 *         notes:
 *           type: string
 *           description: Additional notes
 */

/**
 * @swagger
 * /api/v1/contestants/promote/{registrationId}:
 *   post:
 *     summary: Toggle registration to/from contestant (Admin only)
 *     description: |
 *       This endpoint acts as a toggle:
 *       - If registration is NOT a contestant: Promotes registration to contestant
 *       - If registration IS already a contestant: Removes contestant status
 *     tags: [Contestants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: registrationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Registration ID to promote or demote
 *     responses:
 *       200:
 *         description: Toggle successful - promotes to contestant or removes contestant status
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
 *                   description: Success message indicating the action taken
 *                 data:
 *                   description: Contestant data when promoted, or object with removed flag when demoted
 *       400:
 *         description: Registration not qualified, approved, or submitted
 *       403:
 *         description: Access denied. Admin role required
 *       404:
 *         description: Registration not found
 *       500:
 *         description: Server error
 */
router.post('/promote/:registrationId', authenticateToken, requireAdmin, promoteToContestant);

/**
 * @swagger
 * /api/v1/contestants/vote:
 *   post:
 *     summary: Vote for a contestant
 *     tags: [Contestants]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - contestantId
 *               - contestantEmail
 *               - numberOfVotes
 *               - amountPaid
 *             properties:
 *               contestantId:
 *                 type: string
 *                 description: Contestant ID to vote for
 *                 example: "507f1f77bcf86cd799439011"
 *               contestantEmail:
 *                 type: string
 *                 format: email
 *                 description: Contestant email (for verification)
 *                 example: "contestant@example.com"
 *               numberOfVotes:
 *                 type: number
 *                 minimum: 1
 *                 description: Number of votes
 *                 example: 10
 *               amountPaid:
 *                 type: number
 *                 minimum: 0
 *                 description: Amount paid for votes
 *                 example: 1000
 *               voterInfo:
 *                 type: object
 *                 properties:
 *                   firstName:
 *                     type: string
 *                     example: "John"
 *                   lastName:
 *                     type: string
 *                     example: "Doe"
 *                   email:
 *                     type: string
 *                     format: email
 *                     example: "voter@example.com"
 *                   phone:
 *                     type: string
 *                     example: "+2348012345678"
 *               paymentReference:
 *                 type: string
 *                 description: Payment reference (auto-generated if not provided)
 *                 example: "VOTE_1234567890_abc123"
 *               paymentMethod:
 *                 type: string
 *                 description: Payment method used
 *                 example: "card"
 *               notes:
 *                 type: string
 *                 description: Additional notes
 *     responses:
 *       201:
 *         description: Vote recorded successfully
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
 *                   example: "Vote recorded successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     voteId:
 *                       type: string
 *                     contestantId:
 *                       type: string
 *                     contestantNumber:
 *                       type: string
 *                     contestantName:
 *                       type: string
 *                     numberOfVotes:
 *                       type: number
 *                     amountPaid:
 *                       type: number
 *                     paymentReference:
 *                       type: string
 *                     paymentStatus:
 *                       type: string
 *                     totalVotes:
 *                       type: number
 *                     totalVoteAmount:
 *                       type: number
 *       400:
 *         description: Invalid request data or contestant email mismatch
 *       404:
 *         description: Contestant not found
 *       500:
 *         description: Server error
 */
router.post('/vote', voteForContestant);

/**
 * @swagger
 * /api/v1/contestants/verify-payment/{paymentReference}:
 *   post:
 *     summary: Verify vote payment status
 *     tags: [Contestants]
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
 *                 description: Payment status (0/successful/success/completed/paid for success, 1/failed/failure/declined/error for failure)
 *                 example: "successful"
 *               transaction_status:
 *                 type: string
 *                 description: Alternative status field
 *               paymentStatus:
 *                 type: string
 *                 description: Alternative status field
 *     responses:
 *       200:
 *         description: Vote payment verified successfully
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
 *                   example: "Vote payment verified successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     voteId:
 *                       type: string
 *                     paymentStatus:
 *                       type: string
 *                     contestantId:
 *                       type: string
 *                     numberOfVotes:
 *                       type: number
 *                     amountPaid:
 *                       type: number
 *       404:
 *         description: Vote not found
 *       500:
 *         description: Server error
 */
router.post('/verify-payment/:paymentReference', verifyVotePayment);

/**
 * @swagger
 * /api/v1/contestants:
 *   get:
 *     summary: Get all contestants
 *     tags: [Contestants]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive, eliminated, winner]
 *         description: Filter by contestant status
 *       - in: query
 *         name: talentCategory
 *         schema:
 *           type: string
 *           enum: [Singing, Dancing, Acting, Comedy, Drama, Instrumental, Other]
 *         description: Filter by talent category
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: totalVotes
 *         description: Sort field (e.g., totalVotes, createdAt)
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of contestants per page
 *       - in: query
 *         name: searchQuery
 *         schema:
 *           type: string
 *         description: Search contestants by name (first name, last name, or full name) or contestant number. Searches both fields simultaneously.
 *         example: John
 *     responses:
 *       200:
 *         description: Contestants retrieved successfully
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
 *                   example: "Contestants retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     contestants:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Contestant'
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
 *       500:
 *         description: Server error
 */
router.get('/', getContestants);

/**
 * @swagger
 * /api/v1/contestants/{contestantId}/votes:
 *   get:
 *     summary: Get all votes for a contestant
 *     tags: [Contestants]
 *     parameters:
 *       - in: path
 *         name: contestantId
 *         required: true
 *         schema:
 *           type: string
 *         description: Contestant ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of votes per page
 *       - in: query
 *         name: paymentStatus
 *         schema:
 *           type: string
 *           enum: [pending, processing, completed, failed, refunded]
 *         description: Filter by payment status
 *     responses:
 *       200:
 *         description: Votes retrieved successfully
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
 *                   example: "Votes retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     votes:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Vote'
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
 *       500:
 *         description: Server error
 */
/**
 * @swagger
 * /api/v1/contestants/votes:
 *   get:
 *     summary: Get all votes with filtering and search
 *     tags: [Contestants]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Number of items per page
 *       - in: query
 *         name: paymentStatus
 *         schema:
 *           type: string
 *           enum: [pending, processing, completed, failed, refunded]
 *         description: Filter by payment status
 *       - in: query
 *         name: contestantId
 *         schema:
 *           type: string
 *         description: Filter by contestant ID
 *       - in: query
 *         name: searchQuery
 *         schema:
 *           type: string
 *         description: Search in payment reference, voter info, contestant email
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: createdAt
 *         description: Field to sort by
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Votes retrieved successfully
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
 *                     votes:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Vote'
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
 *       500:
 *         description: Server error
 */
router.get('/votes', getAllVotes);

router.get('/:contestantId/votes', getContestantVotes);

/**
 * @swagger
 * /api/v1/contestants/{contestantId}:
 *   get:
 *     summary: Get a single contestant by ID
 *     tags: [Contestants]
 *     parameters:
 *       - in: path
 *         name: contestantId
 *         required: true
 *         schema:
 *           type: string
 *         description: Contestant ID
 *     responses:
 *       200:
 *         description: Contestant retrieved successfully
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
 *                   example: "Contestant retrieved successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Contestant'
 *       404:
 *         description: Contestant not found
 *       500:
 *         description: Server error
 */
router.get('/:contestantId', getContestant);

export default router;

