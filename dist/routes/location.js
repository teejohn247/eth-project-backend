"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const locationController_1 = require("../controllers/locationController");
const router = (0, express_1.Router)();
router.get('/states', locationController_1.getAllStates);
router.get('/states/:stateName/lgas', locationController_1.getLGAsByState);
router.get('/states/:stateName/lgas/:lgaName', locationController_1.getLGADetails);
router.get('/search', locationController_1.searchLGAs);
router.get('/cache/info', locationController_1.getCacheInfo);
exports.default = router;
//# sourceMappingURL=location.js.map