// Load environment variables FIRST
import dotenv from 'dotenv';
dotenv.config();

import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import { connectDatabase } from './utils/database';
import routes from './routes';
import emailService from './services/emailService';
import swaggerSpecs from './swagger';

const app: Application = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration - Allow all origins
app.use(cors({
  origin: true, // Allow all origins
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar'],
  maxAge: 86400 // 24 hours preflight cache
}));

// Static files middleware
app.use('/public', express.static('public'));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));


// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const timestamp = new Date().toISOString();
  console.log(`${timestamp} - ${req.method} ${req.path} - IP: ${req.ip}`);
  next();
});

// Swagger Documentation
let swaggerDocument = swaggerSpecs;

// Try to use static swagger file in production if available
if (process.env.NODE_ENV === 'production') {
  try {
    const fs = require('fs');
    const path = require('path');
    const staticSwaggerPath = path.join(__dirname, '..', 'swagger-output.json');
    if (fs.existsSync(staticSwaggerPath)) {
      swaggerDocument = JSON.parse(fs.readFileSync(staticSwaggerPath, 'utf8'));
      console.log('📚 Using static Swagger documentation from swagger-output.json');
    }
  } catch (error) {
    console.log('📚 Using dynamic Swagger documentation (static file not found)');
  }
}

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Edo Talent Hunt API Documentation',
  swaggerOptions: {
    docExpansion: 'list', // Expand operations list by default
    defaultModelsExpandDepth: 1,
    defaultModelExpandDepth: 1,
    tagsSorter: 'alpha',
    operationsSorter: 'alpha',
    filter: true,
    tryItOutEnabled: true,
    showExtensions: true,
    showCommonExtensions: true
  }
}));

// Debug endpoint to view Swagger JSON spec
app.get('/api-docs.json', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  res.json(swaggerSpecs);
});

// API routes
app.use('/api/v1', routes);

/**
 * @swagger
 * /:
 *   get:
 *     tags: [Health]
 *     summary: API Root - Welcome message and endpoints
 *     description: Returns welcome message and available API endpoints
 *     responses:
 *       200:
 *         description: Welcome message with API information
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
 *                   example: "Welcome to Edo Talent Hunt API"
 *                 version:
 *                   type: string
 *                   example: "1.0.0"
 *                 documentation:
 *                   type: string
 *                   example: "/api-docs"
 */
// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Welcome to Edo Talent Hunt API',
    version: '1.0.0',
    documentation: '/api-docs',
    endpoints: {
      auth: {
        register: 'POST /api/v1/auth/register',
        verifyOtp: 'POST /api/v1/auth/verify-otp',
        setPassword: 'POST /api/v1/auth/set-password',
        login: 'POST /api/v1/auth/login',
        forgotPassword: 'POST /api/v1/auth/forgot-password',
        verifyResetOtp: 'POST /api/v1/auth/verify-reset-otp',
        resetPassword: 'POST /api/v1/auth/reset-password',
        resendOtp: 'POST /api/v1/auth/resend-otp'
      },
      user: {
        profile: 'GET /api/v1/user/profile',
        dashboard: 'GET /api/v1/user/dashboard'
      },
      registrations: {
        create: 'POST /api/v1/registrations',
        list: 'GET /api/v1/registrations',
        get: 'GET /api/v1/registrations/{id}',
        updatePersonalInfo: 'PUT /api/v1/registrations/{id}/personal-info',
        updateTalentInfo: 'PUT /api/v1/registrations/{id}/talent-info',
        updateGroupInfo: 'PUT /api/v1/registrations/{id}/group-info',
        updateGuardianInfo: 'PUT /api/v1/registrations/{id}/guardian-info',
        updateMediaInfo: 'PUT /api/v1/registrations/{id}/media-info',
        updateAuditionInfo: 'PUT /api/v1/registrations/{id}/audition-info',
        updateTermsConditions: 'PUT /api/v1/registrations/{id}/terms-conditions',
        submit: 'POST /api/v1/registrations/{id}/submit'
      },
      payments: {
        initialize: 'POST /api/v1/payments/initialize/{registrationId}',
        verify: 'POST /api/v1/payments/verify/{reference}',
        webhook: 'POST /api/v1/payments/webhook'
      }
    }
  });
});

// 404 handler
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// Global error handler
app.use((error: any, req: Request, res: Response, next: NextFunction): void => {
  console.error('Global error handler:', error);
  
  // Mongoose validation error
  if (error.name === 'ValidationError') {
    const errors = Object.values(error.errors).map((err: any) => ({
      field: err.path,
      message: err.message
    }));
    
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  return;

  }
  
  // Mongoose duplicate key error
  if (error.code === 11000) {
    const field = Object.keys(error.keyValue)[0];
    res.status(409).json({
      success: false,
      message: `${field} already exists`
    });
  }
  
  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  return;

  }
  
  if (error.name === 'TokenExpiredError') {
    res.status(401).json({
      success: false,
      message: 'Token expired'
    });
  return;

  }
  
  // Default error
  res.status(error.status || 500).json({
    success: false,
    message: error.message || 'Internal server error'
  });
});

// Graceful shutdown function
const createGracefulShutdown = (server: any) => (signal: string) => {
  console.log(`\n${signal} received. Starting graceful shutdown...`);
  
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
  
  // Force close after 10 seconds
  setTimeout(() => {
    console.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

// Start server
const startServer = async () => {
  try {
    // Start HTTP server immediately for Cloud Run health checks
    const server = app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🌐 API Base URL: http://localhost:${PORT}/api/v1`);
      console.log(`📚 Interactive API Documentation: http://localhost:${PORT}/api-docs`);
      console.log(`🔍 Health Check: http://localhost:${PORT}/api/v1/health`);
    });
    
    // Connect to database in background (non-blocking)
    connectDatabase().catch((error) => {
      console.error('❌ Failed to connect to MongoDB on startup, will retry:', error);
    });
    
    // Verify email service (optional, won't stop server if fails)
    emailService.verifyConnection().catch((error) => {
      console.warn('⚠️ Email service verification failed. Email features may not work properly.');
    });
    
    // Handle graceful shutdown
    const gracefulShutdown = createGracefulShutdown(server);
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    
    return server;
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
const server = startServer();

export default app;
