import { Router, Request, Response } from 'express';
import { User, OTP } from '../models';
import { generateToken } from '../utils/jwt';
import emailService from '../services/emailService';
import {
  validate,
  registerSchema,
  loginSchema,
  verifyOTPSchema,
  setPasswordSchema,
  forgotPasswordSchema,
  resendOTPSchema
} from '../middleware/validation';
import { authLimiter, otpLimiter, passwordResetLimiter } from '../middleware/rateLimiter';
import { AuthResponse, OTPResponse } from '../types';

const router = Router();

/**
 * @swagger
 * /auth/register:
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
router.post('/register', authLimiter, validate(registerSchema), async (req: Request, res: Response): Promise<void> => {
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
 * /auth/verify-otp:
 *   post:
 *     tags: [Authentication]
 *     summary: Verify email OTP
 *     description: Verify the OTP sent to user's email during registration
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/VerifyOTPRequest'
 *     responses:
 *       200:
 *         description: Email verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
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
router.post('/verify-otp', authLimiter, validate(verifyOTPSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, otp } = req.body;

    // Verify OTP
    const otpResult = await OTP.verifyOTP(email, otp, 'email_verification');
    if (!otpResult.valid) {
      res.status(400).json({
        success: false,
        message: otpResult.message
      } as AuthResponse);
      return;
    }

    // Update user email verification status
    const user = await User.findOneAndUpdate(
      { email },
      { isEmailVerified: true },
      { new: true }
    );

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      } as AuthResponse);
      return;
    }

    res.json({
      success: true,
      message: 'Email verified successfully. Please set your password.',
      data: {
        user: {
          id: user._id.toString(),
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          isEmailVerified: user.isEmailVerified,
          isPasswordSet: user.isPasswordSet
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

// Set password after email verification
router.post('/set-password', authLimiter, validate(setPasswordSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Find user and verify email is verified
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      } as AuthResponse);
      return;
    }

    if (!user.isEmailVerified) {
      res.status(400).json({
        success: false,
        message: 'Email verification required before setting password'
      } as AuthResponse);
      return;
    }

    // Set password
    user.password = password;
    user.isPasswordSet = true;
    await user.save();

    // Generate JWT token
    const token = generateToken(user);

    res.json({
      success: true,
      message: 'Password set successfully. You can now login.',
      data: {
        token,
        user: {
          id: user._id.toString(),
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          isEmailVerified: user.isEmailVerified,
          isPasswordSet: user.isPasswordSet
        }
      }
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
 * /auth/login:
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
router.post('/login', authLimiter, validate(loginSchema), async (req: Request, res: Response): Promise<void> => {
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

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user._id.toString(),
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          isEmailVerified: user.isEmailVerified,
          isPasswordSet: user.isPasswordSet
        }
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

// Forgot password - Send OTP
router.post('/forgot-password', passwordResetLimiter, validate(forgotPasswordSchema), async (req: Request, res: Response): Promise<void> => {
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

// Verify password reset OTP
router.post('/verify-reset-otp', authLimiter, validate(verifyOTPSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, otp } = req.body;

    // Verify OTP
    const otpResult = await OTP.verifyOTP(email, otp, 'password_reset');
    if (!otpResult.valid) {
      res.status(400).json({
        success: false,
        message: otpResult.message
      } as AuthResponse);
      return;
    }

    res.json({
      success: true,
      message: 'OTP verified successfully. You can now reset your password.',
      data: {
        email
      }
    } as AuthResponse);

  } catch (error: any) {
    console.error('Reset OTP verification error:', error);
    res.status(500).json({
      success: false,
      message: 'OTP verification failed. Please try again.'
    } as AuthResponse);
  }
});

// Reset password after OTP verification
router.post('/reset-password', authLimiter, validate(setPasswordSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      } as AuthResponse);
      return;
    }

    // Set new password
    user.password = password;
    await user.save();

    res.json({
      success: true,
      message: 'Password reset successfully. You can now login with your new password.'
    } as AuthResponse);

  } catch (error: any) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset password. Please try again.'
    } as AuthResponse);
  }
});

// Resend OTP
router.post('/resend-otp', otpLimiter, validate(resendOTPSchema), async (req: Request, res: Response): Promise<void> => {
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

export default router;
