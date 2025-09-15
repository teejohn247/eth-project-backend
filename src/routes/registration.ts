import express from 'express';
import {
  getUserRegistrations,
  createRegistration,
  getRegistration,
  updateRegistration,
  submitRegistration,
  updatePersonalInfo,
  updateTalentInfo,
  updateGroupInfo,
  updateGuardianInfo,
  updateAuditionInfo,
  updateTermsConditions,
  getRegistrationStatus,
  deleteRegistration
} from '../controllers/registrationController';
import { authenticateToken } from '../middleware/auth';
import { validateRegistration, validatePersonalInfo, validateTalentInfo } from '../middleware/validation';

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Registration:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         registrationNumber:
 *           type: string
 *           example: "ETH2024001"
 *         registrationType:
 *           type: string
 *           enum: [individual, group]
 *         personalInfo:
 *           type: object
 *           properties:
 *             firstName:
 *               type: string
 *             lastName:
 *               type: string
 *             email:
 *               type: string
 *             phoneNo:
 *               type: string
 *             dateOfBirth:
 *               type: string
 *               format: date
 *             gender:
 *               type: string
 *               enum: [Male, Female]
 *         talentInfo:
 *           type: object
 *           properties:
 *             talentCategory:
 *               type: string
 *               enum: [Singing, Dancing, Acting, Comedy, Drama, Instrumental, Other]
 *             skillLevel:
 *               type: string
 *               enum: [Beginner, Intermediate, Advanced]
 *         status:
 *           type: string
 *           enum: [draft, submitted, under_review, approved, rejected, qualified, disqualified]
 *         currentStep:
 *           type: number
 *         paymentInfo:
 *           type: object
 *           properties:
 *             amount:
 *               type: number
 *               example: 1090
 *             paymentStatus:
 *               type: string
 *               enum: [pending, processing, completed, failed, refunded]
 */

/**
 * @swagger
 * /api/v1/registrations:
 *   get:
 *     summary: Get user's registrations
 *     tags: [Registrations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Registrations retrieved successfully
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
 *                     $ref: '#/components/schemas/Registration'
 */
router.get('/', authenticateToken, getUserRegistrations);

/**
 * @swagger
 * /api/v1/registrations:
 *   post:
 *     summary: Create new registration
 *     tags: [Registrations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - registrationType
 *             properties:
 *               registrationType:
 *                 type: string
 *                 enum: [individual, group]
 *     responses:
 *       201:
 *         description: Registration created successfully
 *       400:
 *         description: User already has an active registration
 */
router.post('/', authenticateToken, validateRegistration, createRegistration);

/**
 * @swagger
 * /api/v1/registrations/{id}:
 *   get:
 *     summary: Get specific registration
 *     tags: [Registrations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Registration retrieved successfully
 *       404:
 *         description: Registration not found
 */
router.get('/:id', authenticateToken, getRegistration);

/**
 * @swagger
 * /api/v1/registrations/{id}:
 *   put:
 *     summary: Update registration
 *     tags: [Registrations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Registration'
 *     responses:
 *       200:
 *         description: Registration updated successfully
 *       400:
 *         description: Cannot update submitted registration
 *       404:
 *         description: Registration not found
 */
router.put('/:id', authenticateToken, updateRegistration);

/**
 * @swagger
 * /api/v1/registrations/{id}:
 *   delete:
 *     summary: Delete registration (draft only)
 *     tags: [Registrations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Registration deleted successfully
 *       400:
 *         description: Cannot delete submitted registration
 *       404:
 *         description: Registration not found
 */
router.delete('/:id', authenticateToken, deleteRegistration);

/**
 * @swagger
 * /api/v1/registrations/{id}/submit:
 *   post:
 *     summary: Submit completed registration
 *     tags: [Registrations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Registration submitted successfully
 *       400:
 *         description: Registration incomplete or payment pending
 */
router.post('/:id/submit', authenticateToken, submitRegistration);

/**
 * @swagger
 * /api/v1/registrations/{id}/personal-info:
 *   put:
 *     summary: Update personal information step
 *     tags: [Registration Steps]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *               phoneNo:
 *                 type: string
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *               gender:
 *                 type: string
 *                 enum: [Male, Female]
 *     responses:
 *       200:
 *         description: Personal information updated successfully
 */
router.put('/:id/personal-info', authenticateToken, validatePersonalInfo, updatePersonalInfo);

/**
 * @swagger
 * /api/v1/registrations/{id}/talent-info:
 *   put:
 *     summary: Update talent information step
 *     tags: [Registration Steps]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               talentCategory:
 *                 type: string
 *                 enum: [Singing, Dancing, Acting, Comedy, Drama, Instrumental, Other]
 *               skillLevel:
 *                 type: string
 *                 enum: [Beginner, Intermediate, Advanced]
 *     responses:
 *       200:
 *         description: Talent information updated successfully
 */
router.put('/:id/talent-info', authenticateToken, validateTalentInfo, updateTalentInfo);

/**
 * @swagger
 * /api/v1/registrations/{id}/group-info:
 *   put:
 *     summary: Update group information step
 *     tags: [Registration Steps]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Group information updated successfully
 */
router.put('/:id/group-info', authenticateToken, updateGroupInfo);

/**
 * @swagger
 * /api/v1/registrations/{id}/guardian-info:
 *   put:
 *     summary: Update guardian information step
 *     tags: [Registration Steps]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Guardian information updated successfully
 */
router.put('/:id/guardian-info', authenticateToken, updateGuardianInfo);

/**
 * @swagger
 * /api/v1/registrations/{id}/audition-info:
 *   put:
 *     summary: Update audition information step
 *     tags: [Registration Steps]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Audition information updated successfully
 *       400:
 *         description: Audition time slot not available
 */
router.put('/:id/audition-info', authenticateToken, updateAuditionInfo);

/**
 * @swagger
 * /api/v1/registrations/{id}/terms:
 *   put:
 *     summary: Update terms and conditions step
 *     tags: [Registration Steps]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Terms and conditions updated successfully
 */
router.put('/:id/terms', authenticateToken, updateTermsConditions);

/**
 * @swagger
 * /api/v1/registrations/{id}/status:
 *   get:
 *     summary: Get registration status
 *     tags: [Registrations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Registration status retrieved successfully
 */
router.get('/:id/status', authenticateToken, getRegistrationStatus);

export default router;
