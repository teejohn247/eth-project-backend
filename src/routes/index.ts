import { Router } from 'express';
import authRoutes from './auth';
import userRoutes from './user';

const router = Router();

/**
 * @swagger
 * /health:
 *   get:
 *     tags: [Health]
 *     summary: Health Check
 *     description: Check if the API is running and operational
 *     responses:
 *       200:
 *         description: API is healthy and running
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
 *                   example: "Edo Talent Hunt API is running"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: "2025-09-14T12:00:00.000Z"
 *                 version:
 *                   type: string
 *                   example: "1.0.0"
 */
// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Edo Talent Hunt API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Mount route modules
router.use('/auth', authRoutes);
router.use('/user', userRoutes);

export default router;
