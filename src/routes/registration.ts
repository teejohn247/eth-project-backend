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
  updateMediaInfo,
  updateAuditionInfo,
  updateTermsConditions,
  getRegistrationStatus,
  deleteRegistration
} from '../controllers/registrationController';
import { authenticateToken } from '../middleware/auth';
import { validateRegistration, validatePersonalInfo, validateTalentInfo, validateMediaInfo, validateAuditionInfo, validateTermsConditions, validateGroupInfo } from '../middleware/validation';

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
 *             required:
 *               - firstName
 *               - lastName
 *               - email
 *               - phoneNo
 *               - dateOfBirth
 *               - gender
 *               - tshirtSize
 *             properties:
 *               firstName:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 50
 *                 example: "John"
 *               lastName:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 50
 *                 example: "Doe"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "john.doe@example.com"
 *               phoneNo:
 *                 type: string
 *                 pattern: "^(\\+234|0)[789]\\d{9}$"
 *                 example: "08012345678"
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *                 example: "1995-05-15"
 *               placeOfBirth:
 *                 type: string
 *                 maxLength: 100
 *                 example: "Lagos"
 *               gender:
 *                 type: string
 *                 enum: [Male, Female]
 *                 example: "Male"
 *               maritalStatus:
 *                 type: string
 *                 enum: [Single, Married]
 *                 example: "Single"
 *               address:
 *                 type: string
 *                 maxLength: 200
 *                 example: "123 Main Street, Victoria Island"
 *               state:
 *                 type: string
 *                 maxLength: 50
 *                 example: "Lagos"
 *               lga:
 *                 type: string
 *                 maxLength: 50
 *                 example: "Ikeja"
 *               nationality:
 *                 type: string
 *                 maxLength: 50
 *                 example: "Nigerian"
 *               tshirtSize:
 *                 type: string
 *                 enum: [XS, S, M, L, XL, XXL]
 *                 example: "M"
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
 *             required:
 *               - talentCategory
 *               - skillLevel
 *             properties:
 *               talentCategory:
 *                 type: string
 *                 enum: [Singing, Dancing, Acting, Comedy, Drama, Instrumental, Other]
 *                 example: "Singing"
 *               otherTalentCategory:
 *                 type: string
 *                 maxLength: 50
 *                 description: "Required when talentCategory is 'Other'"
 *                 example: "Stand-up Comedy"
 *               skillLevel:
 *                 type: string
 *                 enum: [Beginner, Intermediate, Advanced]
 *                 example: "Intermediate"
 *               stageName:
 *                 type: string
 *                 maxLength: 50
 *                 description: "Optional stage name"
 *                 example: "Starlight"
 *               previouslyParticipated:
 *                 type: string
 *                 enum: [Yes, No]
 *                 description: "Whether user has previously participated in talent hunts"
 *                 example: "Yes"
 *               previousParticipationCategory:
 *                 type: string
 *                 enum: [Singing, Dancing, Acting, Comedy, Drama, Instrumental, Other]
 *                 description: "Required when previouslyParticipated is 'Yes'"
 *                 example: "Dancing"
 *               previousParticipationOtherCategory:
 *                 type: string
 *                 maxLength: 50
 *                 description: "Required when previousParticipationCategory is 'Other'"
 *                 example: "Breakdancing"
 *               competitionName:
 *                 type: string
 *                 maxLength: 100
 *                 description: "Required when previouslyParticipated is 'Yes'"
 *                 example: "Nigeria's Got Talent 2023"
 *               participationPosition:
 *                 type: string
 *                 maxLength: 50
 *                 description: "Position achieved in competition"
 *                 example: "Second Runner-up"
 *     responses:
 *       200:
 *         description: Talent information updated successfully
 */
router.put('/:id/talent-info', authenticateToken, validateTalentInfo, updateTalentInfo);

/**
 * @swagger
 * /api/v1/registrations/{id}/group-info:
 *   put:
 *     summary: Update group information step (for group registrations)
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
 *             required:
 *               - groupName
 *               - noOfGroupMembers
 *               - members
 *             properties:
 *               groupName:
 *                 type: string
 *                 maxLength: 100
 *                 description: "Name of the group"
 *                 example: "hjds"
 *               noOfGroupMembers:
 *                 type: string
 *                 description: "Number of group members (2-5)"
 *                 example: "3"
 *               members:
 *                 type: array
 *                 minItems: 2
 *                 maxItems: 5
 *                 description: "Array of group members"
 *                 items:
 *                   type: object
 *                   required:
 *                     - firstName
 *                     - lastName
 *                     - dateOfBirth
 *                     - gender
 *                     - tshirtSize
 *                   properties:
 *                     firstName:
 *                       type: string
 *                       minLength: 2
 *                       maxLength: 50
 *                       example: "hsdjh"
 *                     lastName:
 *                       type: string
 *                       minLength: 2
 *                       maxLength: 50
 *                       example: "dsjhhjs"
 *                     dateOfBirth:
 *                       type: string
 *                       format: date-time
 *                       example: "2022-09-15T23:00:00.000Z"
 *                     gender:
 *                       type: string
 *                       enum: [Male, Female]
 *                       example: "Male"
 *                     tshirtSize:
 *                       type: string
 *                       enum: [XS, S, M, L, XL, XXL, xs, s, m, l, xl, xxl]
 *                       description: "T-shirt size (case-insensitive)"
 *                       example: "xl"
 *     responses:
 *       200:
 *         description: Group information updated successfully
 *       400:
 *         description: Validation error (invalid group data)
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Registration not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id/group-info', authenticateToken, validateGroupInfo, updateGroupInfo);

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
 * /api/v1/registrations/{id}/media-info:
 *   put:
 *     summary: Update media information step (profile photo and video upload)
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
 *               profilePhoto:
 *                 type: string
 *                 description: "Base64 encoded profile photo (data URL format)"
 *                 example: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD..."
 *               videoUpload:
 *                 type: string
 *                 description: "Base64 encoded audition video (data URL format)"
 *                 example: "data:video/mp4;base64,AAAAIGZ0eXBpc29tAAACAGlzb21pc28y..."
 *     responses:
 *       200:
 *         description: Media information updated successfully
 *       400:
 *         description: Validation error (file size, format, etc.)
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Registration not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id/media-info', authenticateToken, validateMediaInfo, updateMediaInfo);

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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - auditionLocation
 *               - auditionDate
 *               - auditionTime
 *             properties:
 *               auditionLocation:
 *                 type: string
 *                 enum: [Lagos, Benin]
 *                 description: "Location for audition"
 *                 example: "Benin"
 *               auditionDate:
 *                 type: string
 *                 format: date-time
 *                 description: "Date for audition (must be in the future)"
 *                 example: "2025-09-15T23:00:00.000Z"
 *               auditionTime:
 *                 type: string
 *                 pattern: "^([01]\\d|2[0-3]):([0-5]\\d)$"
 *                 description: "Time for audition in HH:mm format"
 *                 example: "9:29 AM"
 *               auditionRequirement:
 *                 type: string
 *                 enum: [Microphone, Guitar, Bass, Drum, BackgroundMusic, StageLighting, Projector, Other]
 *                 description: "Equipment/requirement needed for audition"
 *                 example: "Other"
 *               otherRequirement:
 *                 type: string
 *                 maxLength: 100
 *                 description: "Required when auditionRequirement is 'Other'"
 *                 example: "Special lighting setup"
 *               hasInstrument:
 *                 type: string
 *                 enum: [Yes, No]
 *                 description: "Whether the participant has their own instrument"
 *                 example: "Yes"
 *     responses:
 *       200:
 *         description: Audition information updated successfully
 *       400:
 *         description: Validation error or audition time slot not available
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Registration not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id/audition-info', authenticateToken, validateAuditionInfo, updateAuditionInfo);

/**
 * @swagger
 * /api/v1/registrations/{id}/terms:
 *   put:
 *     summary: Update terms and conditions step (final step with signatures)
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
 *             required:
 *               - rulesAcceptance
 *               - promotionalAcceptance
 *               - contestantSignature
 *             properties:
 *               rulesAcceptance:
 *                 type: boolean
 *                 description: "Must be true - acceptance of competition rules"
 *                 example: true
 *               promotionalAcceptance:
 *                 type: boolean
 *                 description: "Must be true - acceptance of promotional terms"
 *                 example: true
 *               contestantSignature:
 *                 type: string
 *                 description: "Base64 encoded contestant signature (data URL format)"
 *                 example: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASw..."
 *               guardianSignature:
 *                 type: string
 *                 description: "Base64 encoded guardian signature (required for contestants under 16)"
 *                 example: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASw..."
 *     responses:
 *       200:
 *         description: Terms and conditions updated successfully
 *       400:
 *         description: Validation error (missing acceptance or signature)
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Registration not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id/terms', authenticateToken, validateTermsConditions, updateTermsConditions);

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
