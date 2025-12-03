"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const contestantController_1 = require("../controllers/contestantController");
const router = express_1.default.Router();
router.post('/promote/:registrationId', auth_1.authenticateToken, auth_1.requireAdmin, contestantController_1.promoteToContestant);
router.post('/vote', contestantController_1.voteForContestant);
router.post('/verify-payment/:paymentReference', contestantController_1.verifyVotePayment);
router.get('/', contestantController_1.getContestants);
router.get('/:contestantId/votes', contestantController_1.getContestantVotes);
router.get('/:contestantId', contestantController_1.getContestant);
exports.default = router;
//# sourceMappingURL=contestant.js.map