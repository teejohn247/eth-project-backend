"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const adminController_1 = require("../controllers/adminController");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
router.get('/registrations', auth_1.authenticateToken, (0, auth_1.requireRole)(['admin']), adminController_1.getAllRegistrations);
router.get('/transactions', auth_1.authenticateToken, (0, auth_1.requireRole)(['admin']), adminController_1.getAllTransactions);
router.get('/users', auth_1.authenticateToken, (0, auth_1.requireRole)(['admin']), adminController_1.getAllUsers);
router.get('/dashboard', auth_1.authenticateToken, (0, auth_1.requireRole)(['admin']), adminController_1.getDashboardStats);
exports.default = router;
//# sourceMappingURL=admin.js.map