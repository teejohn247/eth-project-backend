"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const paymentController_1 = require("../controllers/paymentController");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
router.post('/initialize/:registrationId', auth_1.authenticateToken, paymentController_1.initializePayment);
router.post('/verify/:reference', paymentController_1.verifyPayment);
router.get('/status/:registrationId', auth_1.authenticateToken, paymentController_1.getPaymentStatus);
router.post('/webhook', paymentController_1.handlePaymentWebhook);
router.post('/refund/:reference', auth_1.authenticateToken, (0, auth_1.requireRole)('admin'), paymentController_1.refundPayment);
router.post('/save-info/:registrationId?', auth_1.authenticateToken, paymentController_1.savePaymentInfo);
router.post('/save-info', auth_1.authenticateToken, paymentController_1.savePaymentInfo);
exports.default = router;
//# sourceMappingURL=payment.js.map