"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const registrationController_1 = require("../controllers/registrationController");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const router = express_1.default.Router();
router.get('/', auth_1.authenticateToken, registrationController_1.getUserRegistrations);
router.post('/', auth_1.authenticateToken, validation_1.validateRegistration, registrationController_1.createRegistration);
router.get('/:id', auth_1.authenticateToken, registrationController_1.getRegistration);
router.put('/:id', auth_1.authenticateToken, registrationController_1.updateRegistration);
router.delete('/:id', auth_1.authenticateToken, registrationController_1.deleteRegistration);
router.post('/:id/submit', auth_1.authenticateToken, registrationController_1.submitRegistration);
router.put('/:id/personal-info', auth_1.authenticateToken, validation_1.validatePersonalInfo, registrationController_1.updatePersonalInfo);
router.put('/:id/talent-info', auth_1.authenticateToken, validation_1.validateTalentInfo, registrationController_1.updateTalentInfo);
router.put('/:id/group-info', auth_1.authenticateToken, registrationController_1.updateGroupInfo);
router.put('/:id/guardian-info', auth_1.authenticateToken, registrationController_1.updateGuardianInfo);
router.put('/:id/audition-info', auth_1.authenticateToken, registrationController_1.updateAuditionInfo);
router.put('/:id/terms', auth_1.authenticateToken, registrationController_1.updateTermsConditions);
router.get('/:id/status', auth_1.authenticateToken, registrationController_1.getRegistrationStatus);
exports.default = router;
//# sourceMappingURL=registration.js.map