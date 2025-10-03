import { Router, Request, Response } from 'express';
import { User, OTP, Registration } from '../models';
import { generateToken } from '../utils/jwt';
import emailService from '../services/emailService';
import { body, validationResult } from 'express-validator';
import { AuthResponse, OTPResponse } from '../types';
import { checkBulkParticipantStatus, resendBulkParticipantOTP } from '../controllers/bulkParticipantController';

const router = Router();

// Validation middleware
const handleValidation = (req: Request, res: Response, next: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
    return;
  }
  next();
};

// Validation schemas
const registerValidation = [
  body('firstName').trim().isLength({ min: 2, max: 50 }).withMessage('First name must be between 2 and 50 characters'),
  body('lastName').trim().isLength({ min: 2, max: 50 }).withMessage('Last name must be between 2 and 50 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email address'),
  handleValidation
];

const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email address'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  handleValidation
];

const otpValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email address'),
  body('otp').isLength({ min: 4, max: 6 }).withMessage('OTP must be between 4 and 6 characters'),
  body('type').optional().isIn(['email_verification', 'password_reset']).withMessage('Type must be either "email_verification" or "password_reset"'),
  handleValidation
];

const passwordValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email address'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  body('otp').optional().isLength({ min: 4, max: 6 }).withMessage('OTP must be between 4 and 6 characters'),
  handleValidation
];

const emailValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email address'),
  handleValidation
];

/**
 * @swagger
 * /api/v1/auth/register:
 *   post:
 *     tags: [Authentication]
 *     summary: Register new user
 *     description: Register a new user account and send email verification OTP
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       201:
 *         description: Registration successful, OTP sent to email
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OTPResponse'
 *       409:
 *         description: User already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Registration failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
// Register new user
router.post('/register', registerValidation, async (req: Request, res: Response): Promise<void> => {
  try {
    const { firstName, lastName, email } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      if (existingUser.isEmailVerified) {
        res.status(409).json({
          success: false,
          message: 'User already exists with this email'
        } as AuthResponse);
        return;
      } else {
        // User exists but email not verified, allow re-registration
        await User.findByIdAndDelete(existingUser._id);
        await OTP.deleteMany({ email });
      }
    }

    // Create new user
    const user = new User({
      firstName,
      lastName,
      email,
      isEmailVerified: false,
      isPasswordSet: false
    });

    await user.save();

    // Generate and send OTP
    const otpDoc = await OTP.createOTP(email, 'email_verification', 10);
    await emailService.sendOTPEmail(email, otpDoc.otp, 'verification');

    res.status(201).json({
      success: true,
      message: 'Registration successful. Please check your email for OTP verification.',
      data: {
        email,
        expiresAt: otpDoc.expiresAt
      }
    } as OTPResponse);

  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed. Please try again.'
    } as AuthResponse);
  }
});

/**
 * @swagger
 * /api/v1/auth/verify-otp:
 *   post:
 *     tags: [Authentication]
 *     summary: Verify OTP (Email verification, Password reset, or Bulk participant registration)
 *     description: Verify OTP for email verification during registration, password reset, or bulk participant account creation. For bulk participants, this creates their account and registration. The type is auto-detected based on user status.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User email address
 *                 example: john.doe@example.com
 *               otp:
 *                 type: string
 *                 minLength: 4
 *                 maxLength: 6
 *                 description: OTP code received via email
 *                 example: "123456"
 *               type:
 *                 type: string
 *                 enum: [email_verification, password_reset]
 *                 description: OTP type (optional - auto-detected if not provided)
 *                 example: "email_verification"
 *     responses:
 *       200:
 *         description: OTP verified successfully
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
 *                   example: "Email verified successfully. Please set your password."
 *                 data:
 *                   type: object
 *                   properties:
 *                     otpType:
 *                       type: string
 *                       enum: [email_verification, password_reset]
 *                       description: The type of OTP that was verified
 *                       example: "email_verification"
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     nextStep:
 *                       type: string
 *                       description: What the user should do next
 *                       example: "set-password"
 *       400:
 *         description: Invalid or expired OTP
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
// Verify OTP
router.post('/verify-otp', otpValidation, async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, otp, type } = req.body;

    // Check if this is a bulk participant scenario (user doesn't exist yet)
    let user = await User.findOne({ email });
    let isBulkParticipant = false;
    let bulkRegistration: any = null;
    let participant: any = null;

    if (!user) {
      // Check if this is a bulk participant invitation
      const { BulkRegistration } = await import('../models');
      bulkRegistration = await BulkRegistration.findOne({
        'participants.email': email
      });

      if (bulkRegistration) {
        participant = bulkRegistration.participants.find((p: any) => p.email === email);
        
        if (participant && !participant.participantId) {
          isBulkParticipant = true;
          
          // Verify OTP for bulk participant
          const otpResult = await OTP.verifyOTP(email, otp, 'email_verification');
          if (!otpResult.valid) {
            res.status(400).json({
              success: false,
              message: otpResult.message
            } as AuthResponse);
            return;
          }

          // Create user account for bulk participant (without password)
          user = new User({
            firstName: participant.firstName,
            lastName: participant.lastName,
            email: participant.email,
            role: 'contestant',
            isActive: true,
            isEmailVerified: true,
            isPasswordSet: false, // Password will be set in next step
            emailVerifiedAt: new Date()
          });

          await user.save();

          // Create registration for the participant
          const registration = new Registration({
            userId: user._id,
            registrationType: 'individual',
            isBulkParticipant: true,
            bulkRegistrationId: bulkRegistration._id,
            paidBy: bulkRegistration.ownerId // Set who paid for this participant
          });

          await registration.save();

          // Update participant information in bulk registration
          participant.participantId = user._id;
          participant.registrationId = registration._id;
          participant.invitationStatus = 'registered';
          participant.registeredAt = new Date();

          await bulkRegistration.save();

          // Return success response for bulk participant
          res.json({
            success: true,
            message: 'OTP verified successfully. Your account has been created. Please set your password.',
            data: {
              otpType: 'email_verification',
              nextStep: 'set-password',
              isBulkParticipant: true,
              user: {
                id: user._id.toString(),
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role,
                isEmailVerified: user.isEmailVerified,
                isPasswordSet: user.isPasswordSet
              },
              registration: {
                registrationId: registration._id.toString(),
                registrationNumber: registration.registrationNumber,
                currentStep: registration.currentStep,
                status: registration.status,
                isBulkParticipant: true,
                bulkRegistrationNumber: bulkRegistration.bulkRegistrationNumber,
                paymentRequired: false
              }
            }
          } as AuthResponse);
          return;
        }
      }
      
      // If not a bulk participant and user not found
      res.status(404).json({
        success: false,
        message: 'User not found and no bulk participant invitation found for this email'
      } as AuthResponse);
      return;
    }

    // Auto-detect OTP type if not provided
    let otpType: 'email_verification' | 'password_reset';
    if (type) {
      // Use provided type if valid
      if (type !== 'email_verification' && type !== 'password_reset') {
        res.status(400).json({
          success: false,
          message: 'Invalid OTP type. Must be either "email_verification" or "password_reset"'
        } as AuthResponse);
        return;
      }
      otpType = type;
    } else {
      // Auto-detect based on user status
      otpType = user.isEmailVerified ? 'password_reset' : 'email_verification';
    }

    // Verify OTP - for password reset, just check validity without consuming
    let otpResult;
    if (otpType === 'password_reset') {
      // Just check OTP validity without consuming it
      otpResult = await OTP.checkOTP(email, otp, otpType);
    } else {
      // For email verification, consume the OTP
      otpResult = await OTP.verifyOTP(email, otp, otpType);
    }
    
    if (!otpResult.valid) {
      res.status(400).json({
        success: false,
        message: otpResult.message
      } as AuthResponse);
      return;
    }

    // Update user status based on OTP type
    let updatedUser = user;
    let message = '';
    let nextStep = '';

    if (otpType === 'email_verification') {
      // Mark email as verified for new account
      updatedUser = await User.findOneAndUpdate(
      { email },
      { isEmailVerified: true },
      { new: true }
    );
      message = 'Email verified successfully. Please set your password.';
      nextStep = 'set-password';
    } else {
      // Password reset OTP verified - user can now reset password
      message = 'OTP verified successfully. You can now reset your password.';
      nextStep = 'set-password';
    }

    if (!updatedUser) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      } as AuthResponse);
      return;
    }

    res.json({
      success: true,
      message,
      data: {
        otpType,
        nextStep,
        user: {
          id: updatedUser._id.toString(),
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          email: updatedUser.email,
          role: updatedUser.role,
          isEmailVerified: updatedUser.isEmailVerified,
          isPasswordSet: updatedUser.isPasswordSet
        }
      }
    } as AuthResponse);

  } catch (error: any) {
    console.error('OTP verification error:', error);
    res.status(500).json({
      success: false,
      message: 'OTP verification failed. Please try again.'
    } as AuthResponse);
  }
});

/**
 * @swagger
 * /api/v1/auth/set-password:
 *   post:
 *     tags: [Authentication]
 *     summary: Set password (initial setup, reset, or bulk participant registration)
 *     description: Set user password after email verification OR reset password with OTP OR create account for bulk participants. Supports initial password setup, password reset flows, and bulk participant registration.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - confirmPassword
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User email address
 *                 example: john.doe@example.com
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 description: New password (minimum 6 characters)
 *                 example: securePassword123
 *               confirmPassword:
 *                 type: string
 *                 minLength: 6
 *                 description: Confirm password (must match password)
 *                 example: securePassword123
 *               otp:
 *                 type: string
 *                 minLength: 4
 *                 maxLength: 6
 *                 description: OTP for verification (required for password reset, optional for initial setup if email already verified)
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Password set/reset successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Validation error, invalid OTP, or email not verified
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Email not verified or password already set
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/set-password', passwordValidation, async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, otp } = req.body;

    // Find user (should exist for all scenarios now)
    let user = await User.findOne({ email }).select('+password');
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found. Please verify your OTP first.'
      } as AuthResponse);
      return;
    }

    // Check if this is a bulk participant (account created by verify-otp but password not set)
    const isBulkParticipant = !user.isPasswordSet && user.isEmailVerified;

    // Handle OTP verification if provided (for password reset flow or regular users)
    if (otp && !isBulkParticipant) {
      // Determine OTP type based on user status
      const otpType = user.isEmailVerified ? 'password_reset' : 'email_verification';
      
      // Verify OTP
      const otpResult = await OTP.verifyOTP(email, otp, otpType);
      if (!otpResult.valid) {
      res.status(400).json({
        success: false,
          message: otpResult.message
      } as AuthResponse);
      return;
      }

      // Mark email as verified if it was email verification OTP
      if (otpType === 'email_verification') {
        user.isEmailVerified = true;
      }
    } else if (!isBulkParticipant) {
      // Original flow: check if email is already verified for regular users
      if (!user.isEmailVerified) {
        res.status(400).json({
          success: false,
          message: 'Email verification required before setting password. Please provide OTP.'
        } as AuthResponse);
        return;
      }
    }

    // Set password for all users (including bulk participants)
    user.password = password;
    user.isPasswordSet = true;
    await user.save();

    // Generate JWT token
    const token = generateToken(user);

    // Determine response message based on context
    let message = '';
    if (isBulkParticipant) {
      message = 'Account created successfully.';
    } else {
      const isPasswordReset = user.isPasswordSet && otp;
      message = isPasswordReset 
        ? 'Password reset successfully. You can now login with your new password.'
        : 'Password set successfully. You can now login.';
    }

    // Prepare response data
    const responseData: any = {
      token,
      user: {
        id: user._id.toString(),
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        isPasswordSet: user.isPasswordSet
      }
    };

    // Add registration info for bulk participants
    if (isBulkParticipant) {
      const registrationDoc = await Registration.findOne({ userId: user._id, isBulkParticipant: true });
      if (registrationDoc) {
        const bulkRegDoc = await (await import('../models')).BulkRegistration.findById(registrationDoc.bulkRegistrationId);
        responseData.registration = {
          registrationId: registrationDoc._id.toString(),
          registrationNumber: registrationDoc.registrationNumber,
          currentStep: registrationDoc.currentStep || 0,
          status: registrationDoc.status || 'draft',
          isBulkParticipant: true,
          bulkRegistrationNumber: bulkRegDoc?.bulkRegistrationNumber || '',
          paymentRequired: false
        };
      }
    }

    res.json({
      success: true,
      message,
      data: responseData
    } as AuthResponse);

  } catch (error: any) {
    console.error('Set password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to set password. Please try again.'
    } as AuthResponse);
  }
});

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     tags: [Authentication]
 *     summary: User login
 *     description: Authenticate user with email and password, returns JWT token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         description: Invalid credentials, email not verified, or password not set
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Login failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
// Login
router.post('/login', loginValidation, async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Find user with password
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      } as AuthResponse);
      return;
    }

    // Check if email is verified
    if (!user.isEmailVerified) {
      res.status(401).json({
        success: false,
        message: 'Please verify your email before logging in'
      } as AuthResponse);
      return;
    }

    // Check if password is set
    if (!user.isPasswordSet || !user.password) {
      res.status(401).json({
        success: false,
        message: 'Please complete your registration by setting a password'
      } as AuthResponse);
      return;
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      } as AuthResponse);
      return;
    }

    // Generate JWT token
    const token = generateToken(user);

    // Prepare user response object
    const userResponse: any = {
      id: user._id.toString(),
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
      isPasswordSet: user.isPasswordSet
    };

    // For contestants, add registration information
    if (user.role === 'contestant') {
      const registration = await Registration.findOne({ userId: user._id });
      
      if (registration) {
        // Define the step mapping
        const stepNames = {
          0: 'not_started',
          1: 'personal_info',
          2: 'talent_info', 
          3: 'group_info',
          4: 'guardian_info',
          5: 'media_info',
          6: 'audition_info',
          7: 'terms_conditions',
          8: 'payment'
        };

        // Determine required steps based on registration type
        const requiredSteps = registration.registrationType === 'individual' ? 
          [1, 2, 4, 5, 6, 7, 8] : // personal, talent, guardian, media, audition, terms, payment
          [1, 2, 3, 5, 6, 7, 8];  // personal, talent, group, media, audition, terms, payment

        // Check if registration is complete
        const allRequiredStepsCompleted = requiredSteps.every(step => 
          registration.completedSteps.includes(step)
        );
        const registrationComplete = allRequiredStepsCompleted && 
          registration.status === 'submitted' && 
          registration.paymentInfo.paymentStatus === 'completed';

        // Determine last completed step
        const completedSteps = registration.completedSteps.sort((a, b) => b - a);
        const lastStep = completedSteps.length > 0 ? completedSteps[0] : 0;
        const lastStepName = stepNames[lastStep as keyof typeof stepNames] || 'unknown';

        // Determine current step (next step to complete)
        const currentStep = registration.currentStep;
        const currentStepName = stepNames[currentStep as keyof typeof stepNames] || 'unknown';

        userResponse.registrationInfo = {
          currentStep,
          currentStepName,
          lastStep,
          lastStepName,
          registrationComplete,
          registrationStatus: registration.status,
          paymentStatus: registration.paymentInfo.paymentStatus,
          completedSteps: registration.completedSteps,
          registrationNumber: registration.registrationNumber,
          registrationType: registration.registrationType
        };
      } else {
        // No registration found - user needs to start registration
        userResponse.registrationInfo = {
          currentStep: 0,
          currentStepName: 'not_started',
          lastStep: 0,
          lastStepName: 'not_started', 
          registrationComplete: false,
          registrationStatus: null,
          paymentStatus: null,
          completedSteps: [],
          registrationNumber: null,
          registrationType: null
        };
      }
    }

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: userResponse
      }
    } as AuthResponse);

  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed. Please try again.'
    } as AuthResponse);
  }
});

/**
 * @swagger
 * /api/v1/auth/forgot-password:
 *   post:
 *     tags: [Authentication]
 *     summary: Forgot password - Send OTP
 *     description: Send password reset OTP to user's verified email address
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: "User's registered email address"
 *                 example: "john.doe@example.com"
 *     responses:
 *       200:
 *         description: Password reset OTP sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OTPResponse'
 *       400:
 *         description: Email not verified or validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       429:
 *         description: Too many requests
 *       500:
 *         description: Internal server error
 */
// Forgot password - Send OTP
router.post('/forgot-password', emailValidation, async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    // Check if user exists and is verified
    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if user exists or not for security
      res.json({
        success: true,
        message: 'If an account with this email exists, you will receive a password reset OTP.'
      } as AuthResponse);
      return;
    }

    if (!user.isEmailVerified) {
      res.status(400).json({
        success: false,
        message: 'Email not verified. Please complete registration first.'
      } as AuthResponse);
      return;
    }

    // Generate and send OTP
    const otpDoc = await OTP.createOTP(email, 'password_reset', 10);
    await emailService.sendOTPEmail(email, otpDoc.otp, 'password_reset');

    res.json({
      success: true,
      message: 'Password reset OTP sent to your email.',
      data: {
        email,
        expiresAt: otpDoc.expiresAt
      }
    } as OTPResponse);

  } catch (error: any) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send password reset OTP. Please try again.'
    } as AuthResponse);
  }
});

// Note: verify-reset-otp and reset-password endpoints have been removed.
// Use the unified set-password endpoint with OTP parameter for password reset flow.

/**
 * @swagger
 * /api/v1/auth/resend-otp:
 *   post:
 *     tags: [Authentication]
 *     summary: Resend OTP
 *     description: Resend OTP for email verification or password reset based on user status
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: "User's registered email address"
 *                 example: "john.doe@example.com"
 *     responses:
 *       200:
 *         description: OTP resent successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OTPResponse'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       429:
 *         description: Too many requests
 *       500:
 *         description: Internal server error
 */
// Resend OTP
router.post('/resend-otp', emailValidation, async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      } as AuthResponse);
      return;
    }

    // Determine OTP type based on user status
    const otpType = user.isEmailVerified ? 'password_reset' : 'email_verification';
    const emailType = user.isEmailVerified ? 'password_reset' : 'verification';

    // Generate and send new OTP
    const otpDoc = await OTP.createOTP(email, otpType, 10);
    await emailService.sendOTPEmail(email, otpDoc.otp, emailType);

    res.json({
      success: true,
      message: 'New OTP sent to your email.',
      data: {
        email,
        expiresAt: otpDoc.expiresAt
      }
    } as OTPResponse);

  } catch (error: any) {
    console.error('Resend OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resend OTP. Please try again.'
    } as AuthResponse);
  }
});


/**
 * @swagger
 * /api/v1/auth/bulk-participant/status/{email}:
 *   get:
 *     summary: Check bulk participant invitation status
 *     tags: [Authentication]
 *     parameters:
 *       - in: path
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *           format: email
 *         description: Email address of the bulk participant
 *     responses:
 *       200:
 *         description: Participant status retrieved successfully
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
 *                   example: "Bulk participant status retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     email: { type: string }
 *                     firstName: { type: string }
 *                     lastName: { type: string }
 *                     invitationStatus: { type: string }
 *                     invitationSentAt: { type: string, format: date-time }
 *                     registeredAt: { type: string, format: date-time }
 *                     bulkRegistrationNumber: { type: string }
 *                     hasAccount: { type: boolean }
 *                     hasRegistration: { type: boolean }
 *                     participantId: { type: string }
 *                     registrationId: { type: string }
 *       404:
 *         description: Bulk registration invitation not found
 *       500:
 *         description: Server error
 */
router.get('/bulk-participant/status/:email', checkBulkParticipantStatus);

/**
 * @swagger
 * /api/v1/auth/bulk-participant/resend-otp:
 *   post:
 *     summary: Resend OTP for bulk participant
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email address of the bulk participant
 *                 example: "participant@example.com"
 *     responses:
 *       200:
 *         description: New OTP sent successfully
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
 *                   example: "New OTP sent successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     email: { type: string }
 *                     expiresAt: { type: string, format: date-time }
 *                     bulkRegistrationNumber: { type: string }
 *       400:
 *         description: Validation error or participant already registered
 *       404:
 *         description: Bulk registration invitation not found
 *       500:
 *         description: Server error
 */
router.post('/bulk-participant/resend-otp', [
  body('email').isEmail().withMessage('Please provide a valid email'),
  handleValidation
], resendBulkParticipantOTP);

export default router;
