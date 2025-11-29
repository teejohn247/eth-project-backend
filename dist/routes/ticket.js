"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const ticketController_1 = require("../controllers/ticketController");
const router = express_1.default.Router();
router.get('/', ticketController_1.getTickets);
router.get('/:ticketType', ticketController_1.getTicketByType);
router.post('/purchase', ticketController_1.purchaseTickets);
router.post('/verify-payment/:paymentReference', ticketController_1.verifyTicketPayment);
router.get('/purchase/:purchaseReference', ticketController_1.getPurchaseDetails);
exports.default = router;
//# sourceMappingURL=ticket.js.map