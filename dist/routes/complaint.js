"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const complaintController_1 = require("../controllers/complaintController");
const router = express_1.default.Router();
router.post('/', auth_1.authenticateToken, validation_1.validateComplaint, validation_1.handleValidationErrors, complaintController_1.createComplaint);
router.get('/', auth_1.authenticateToken, complaintController_1.getUserComplaints);
router.get('/:id', auth_1.authenticateToken, complaintController_1.getComplaintById);
router.get('/admin/all', auth_1.authenticateToken, (0, auth_1.requireRole)('admin'), complaintController_1.getAllComplaints);
router.patch('/admin/:id/status', auth_1.authenticateToken, (0, auth_1.requireRole)('admin'), validation_1.validateComplaintStatus, validation_1.handleValidationErrors, complaintController_1.updateComplaintStatus);
exports.default = router;
//# sourceMappingURL=complaint.js.map