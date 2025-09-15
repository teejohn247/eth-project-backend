"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const database_1 = require("./utils/database");
const rateLimiter_1 = require("./middleware/rateLimiter");
const routes_1 = __importDefault(require("./routes"));
const emailService_1 = __importDefault(require("./services/emailService"));
const swagger_1 = __importDefault(require("./swagger"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
app.use((0, helmet_1.default)({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
}));
app.use((0, cors_1.default)({
    origin: process.env.NODE_ENV === 'production'
        ? (process.env.ALLOWED_ORIGINS?.split(',') || ['https://yourdomain.com'])
        : ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
app.use(rateLimiter_1.generalLimiter);
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`${timestamp} - ${req.method} ${req.path} - IP: ${req.ip}`);
    next();
});
let swaggerDocument = swagger_1.default;
if (process.env.NODE_ENV === 'production') {
    try {
        const fs = require('fs');
        const path = require('path');
        const staticSwaggerPath = path.join(__dirname, '..', 'swagger-output.json');
        if (fs.existsSync(staticSwaggerPath)) {
            swaggerDocument = JSON.parse(fs.readFileSync(staticSwaggerPath, 'utf8'));
            console.log('📚 Using static Swagger documentation from swagger-output.json');
        }
    }
    catch (error) {
        console.log('📚 Using dynamic Swagger documentation (static file not found)');
    }
}
app.use('/api-docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swaggerDocument, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Edo Talent Hunt API Documentation',
    swaggerOptions: {
        docExpansion: 'list',
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
app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.json(swagger_1.default);
});
app.use('/api/v1', routes_1.default);
app.get('/', (req, res) => {
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
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} not found`
    });
});
app.use((error, req, res, next) => {
    console.error('Global error handler:', error);
    if (error.name === 'ValidationError') {
        const errors = Object.values(error.errors).map((err) => ({
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
    if (error.code === 11000) {
        const field = Object.keys(error.keyValue)[0];
        res.status(409).json({
            success: false,
            message: `${field} already exists`
        });
    }
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
    res.status(error.status || 500).json({
        success: false,
        message: error.message || 'Internal server error'
    });
});
const createGracefulShutdown = (server) => (signal) => {
    console.log(`\n${signal} received. Starting graceful shutdown...`);
    server.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
    });
    setTimeout(() => {
        console.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
    }, 10000);
};
const startServer = async () => {
    try {
        const server = app.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
            console.log(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`🌐 API Base URL: http://localhost:${PORT}/api/v1`);
            console.log(`📚 Interactive API Documentation: http://localhost:${PORT}/api-docs`);
            console.log(`🔍 Health Check: http://localhost:${PORT}/api/v1/health`);
        });
        (0, database_1.connectDatabase)().catch((error) => {
            console.error('❌ Failed to connect to MongoDB on startup, will retry:', error);
        });
        emailService_1.default.verifyConnection().catch((error) => {
            console.warn('⚠️ Email service verification failed. Email features may not work properly.');
        });
        const gracefulShutdown = createGracefulShutdown(server);
        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));
        return server;
    }
    catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};
const server = startServer();
exports.default = app;
//# sourceMappingURL=server.js.map