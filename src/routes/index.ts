import { Router } from 'express';
import authRoutes from './auth';
import userRoutes from './user';
import registrationRoutes from './registration';
import bulkRegistrationRoutes from './bulkRegistration';
import paymentRoutes from './payment';
import locationRoutes from './location';
import adminRoutes from './admin';
import complaintRoutes from './complaint';
import ticketRoutes from './ticket';

const router = Router();

/**
 * @swagger
 * /api/v1/health:
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
router.get('/health', async (req, res) => {
  const mongoose = require('mongoose');
  
  // Check database connection status
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  const isHealthy = mongoose.connection.readyState === 1;
  
  res.status(isHealthy ? 200 : 503).json({
    success: isHealthy,
    message: isHealthy ? 'Edo Talent Hunt API is running' : 'API is starting up',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    database: dbStatus,
    endpoints: {
      authentication: '/api/v1/auth',
      user: '/api/v1/user',
      registrations: '/api/v1/registrations',
      bulkRegistrations: '/api/v1/bulk-registrations',
           payments: '/api/v1/payments',
           locations: '/api/v1/locations',
           admin: '/api/v1/admin',
           complaints: '/api/v1/complaints',
           tickets: '/api/v1/tickets',
           documentation: '/api-docs'
    }
  });
});

// Mount route modules
router.use('/auth', authRoutes);
router.use('/user', userRoutes);
router.use('/registrations', registrationRoutes);
router.use('/bulk-registrations', bulkRegistrationRoutes);
router.use('/payments', paymentRoutes);
router.use('/locations', locationRoutes);
router.use('/admin', adminRoutes);
router.use('/complaints', complaintRoutes);
router.use('/tickets', ticketRoutes);

export default router;
