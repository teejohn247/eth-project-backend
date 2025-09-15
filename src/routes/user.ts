import { Router, Request, Response } from 'express';
import { User } from '../models';
import { authenticateToken, requireCompleteProfile } from '../middleware/auth';
import { AuthResponse } from '../types';

const router = Router();

/**
 * @swagger
 * /user/profile:
 *   get:
 *     tags: [User]
 *     summary: Get user profile
 *     description: Retrieve the authenticated user's profile information
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         description: Access token is required or invalid
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
 *         description: Failed to retrieve profile
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
// Get user profile
router.get('/profile', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user?.userId);
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      } as AuthResponse);
      return;
    }

    res.json({
      success: true,
      message: 'Profile retrieved successfully',
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
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve profile'
    } as AuthResponse);
  }
});

/**
 * @swagger
 * /user/dashboard:
 *   get:
 *     tags: [User]
 *     summary: Access user dashboard
 *     description: Access the user dashboard (requires complete profile)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard accessed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         description: Access token is required or profile incomplete
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Failed to load dashboard
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
// Protected route example (requires complete profile)
router.get('/dashboard', authenticateToken, requireCompleteProfile, async (req: Request, res: Response): Promise<void> => {
  try {
    res.json({
      success: true,
      message: 'Welcome to your dashboard!',
      data: {
        user: {
          id: req.user?.userId || '',
          firstName: '',
          lastName: '',
          email: req.user?.email || '',
          isEmailVerified: req.user?.isEmailVerified || false,
          isPasswordSet: req.user?.isPasswordSet || false
        }
      }
    } as AuthResponse);

  } catch (error: any) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load dashboard'
    } as AuthResponse);
  }
});

export default router;
