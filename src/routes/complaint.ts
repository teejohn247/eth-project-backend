import express from 'express';
import { authenticateToken, requireRole } from '../middleware/auth';
import { validateComplaint, validateComplaintStatus, handleValidationErrors } from '../middleware/validation';
import { 
  createComplaint, 
  getUserComplaints, 
  getComplaintById,
  getAllComplaints,
  updateComplaintStatus
} from '../controllers/complaintController';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Complaints
 *   description: Support complaint management endpoints
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Complaint:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Complaint ID
 *         firstName:
 *           type: string
 *           description: User's first name
 *         lastName:
 *           type: string
 *           description: User's last name
 *         email:
 *           type: string
 *           description: User's email
 *         complaintType:
 *           type: string
 *           description: Type of complaint
 *         description:
 *           type: string
 *           description: Detailed description of the complaint
 *         status:
 *           type: string
 *           enum: [Pending, In Progress, Resolved, Closed]
 *           description: Current status of the complaint
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: When the complaint was created
 *         resolvedAt:
 *           type: string
 *           format: date-time
 *           description: When the complaint was resolved (if applicable)
 */

/**
 * @swagger
 * /api/v1/complaints:
 *   post:
 *     summary: Submit a new complaint
 *     tags: [Complaints]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - complaintType
 *               - description
 *             properties:
 *               complaintType:
 *                 type: string
 *                 description: Type of complaint (e.g., Technical Issue, Payment Problem, General Inquiry)
 *                 example: "Technical Issue"
 *               description:
 *                 type: string
 *                 description: Detailed description of the complaint
 *                 example: "Unable to upload profile photo during registration"
 *     responses:
 *       201:
 *         description: Complaint submitted successfully
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
 *                   example: "Complaint submitted successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Complaint'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/', authenticateToken, validateComplaint, handleValidationErrors, createComplaint);

/**
 * @swagger
 * /api/v1/complaints:
 *   get:
 *     summary: Get user's complaints
 *     tags: [Complaints]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of complaints per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Pending, In Progress, Resolved, Closed]
 *         description: Filter by complaint status
 *     responses:
 *       200:
 *         description: Complaints retrieved successfully
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
 *                   example: "Complaints retrieved successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Complaint'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     currentPage:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                     totalCount:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     hasNextPage:
 *                       type: boolean
 *                     hasPrevPage:
 *                       type: boolean
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/', authenticateToken, getUserComplaints);

/**
 * @swagger
 * /api/v1/complaints/{id}:
 *   get:
 *     summary: Get specific complaint details
 *     tags: [Complaints]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Complaint ID
 *     responses:
 *       200:
 *         description: Complaint retrieved successfully
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
 *                   example: "Complaint retrieved successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Complaint'
 *       404:
 *         description: Complaint not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/:id', authenticateToken, getComplaintById);

/**
 * @swagger
 * /api/v1/complaints/admin/all:
 *   get:
 *     summary: Get all complaints (Admin only)
 *     tags: [Complaints]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of complaints per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Pending, In Progress, Resolved, Closed]
 *         description: Filter by complaint status
 *       - in: query
 *         name: complaintType
 *         schema:
 *           type: string
 *         description: Filter by complaint type
 *     responses:
 *       200:
 *         description: All complaints retrieved successfully
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
 *                   example: "All complaints retrieved successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Complaint'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     currentPage:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                     totalCount:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     hasNextPage:
 *                       type: boolean
 *                     hasPrevPage:
 *                       type: boolean
 *                 filters:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                     complaintType:
 *                       type: string
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Admin access required)
 *       500:
 *         description: Server error
 */
router.get('/admin/all', authenticateToken, requireRole('admin'), getAllComplaints);

/**
 * @swagger
 * /api/v1/complaints/admin/{id}/status:
 *   patch:
 *     summary: Update complaint status (Admin only)
 *     tags: [Complaints]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Complaint ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [Pending, In Progress, Resolved, Closed]
 *                 description: New status for the complaint
 *                 example: "Resolved"
 *     responses:
 *       200:
 *         description: Complaint status updated successfully
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
 *                   example: "Complaint status updated successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Complaint'
 *       404:
 *         description: Complaint not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Admin access required)
 *       500:
 *         description: Server error
 */
router.patch('/admin/:id/status', authenticateToken, requireRole('admin'), validateComplaintStatus, handleValidationErrors, updateComplaintStatus);

export default router;
