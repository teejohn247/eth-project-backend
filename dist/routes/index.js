"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = __importDefault(require("./auth"));
const user_1 = __importDefault(require("./user"));
const registration_1 = __importDefault(require("./registration"));
const payment_1 = __importDefault(require("./payment"));
const location_1 = __importDefault(require("./location"));
const admin_1 = __importDefault(require("./admin"));
const router = (0, express_1.Router)();
router.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Edo Talent Hunt API is running',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        endpoints: {
            authentication: '/api/v1/auth',
            user: '/api/v1/user',
            registrations: '/api/v1/registrations',
            payments: '/api/v1/payments',
            locations: '/api/v1/locations',
            admin: '/api/v1/admin',
            documentation: '/api-docs'
        }
    });
});
router.use('/auth', auth_1.default);
router.use('/user', user_1.default);
router.use('/registrations', registration_1.default);
router.use('/payments', payment_1.default);
router.use('/locations', location_1.default);
router.use('/admin', admin_1.default);
exports.default = router;
//# sourceMappingURL=index.js.map