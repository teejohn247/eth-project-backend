"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = __importDefault(require("./auth"));
const user_1 = __importDefault(require("./user"));
const registration_1 = __importDefault(require("./registration"));
const bulkRegistration_1 = __importDefault(require("./bulkRegistration"));
const payment_1 = __importDefault(require("./payment"));
const location_1 = __importDefault(require("./location"));
const admin_1 = __importDefault(require("./admin"));
const complaint_1 = __importDefault(require("./complaint"));
const router = (0, express_1.Router)();
router.get('/health', async (req, res) => {
    const mongoose = require('mongoose');
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
            documentation: '/api-docs'
        }
    });
});
router.use('/auth', auth_1.default);
router.use('/user', user_1.default);
router.use('/registrations', registration_1.default);
router.use('/bulk-registrations', bulkRegistration_1.default);
router.use('/payments', payment_1.default);
router.use('/locations', location_1.default);
router.use('/admin', admin_1.default);
router.use('/complaints', complaint_1.default);
exports.default = router;
//# sourceMappingURL=index.js.map