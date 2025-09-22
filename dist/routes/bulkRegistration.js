"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const bulkRegistrationController_1 = require("../controllers/bulkRegistrationController");
const router = express_1.default.Router();
router.post('/', auth_1.authenticateToken, bulkRegistrationController_1.createBulkRegistration);
router.get('/', auth_1.authenticateToken, bulkRegistrationController_1.listBulkRegistrations);
router.get('/:bulkRegistrationId', auth_1.authenticateToken, bulkRegistrationController_1.getBulkRegistration);
router.post('/:bulkRegistrationId/payment', auth_1.authenticateToken, bulkRegistrationController_1.processBulkPayment);
router.post('/:bulkRegistrationId/participants', auth_1.authenticateToken, bulkRegistrationController_1.addParticipant);
exports.default = router;
//# sourceMappingURL=bulkRegistration.js.map