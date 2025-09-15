"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const models_1 = require("../models");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.get('/profile', auth_1.authenticateToken, async (req, res) => {
    try {
        const user = await models_1.User.findById(req.user?.userId);
        if (!user) {
            res.status(404).json({
                success: false,
                message: 'User not found'
            });
            return;
        }
        res.json({
            success: true,
            message: 'Profile retrieved successfully',
            data: {
                user: {
                    id: user._id.toString(),
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    isEmailVerified: user.isEmailVerified,
                    isPasswordSet: user.isPasswordSet
                }
            }
        });
    }
    catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve profile'
        });
    }
});
router.get('/dashboard', auth_1.authenticateToken, auth_1.requireCompleteProfile, async (req, res) => {
    try {
        res.json({
            success: true,
            message: 'Welcome to your dashboard!',
            data: {
                user: {
                    id: req.user?.userId || '',
                    firstName: '',
                    lastName: '',
                    email: req.user?.email || '',
                    isEmailVerified: req.user?.isEmailVerified || false,
                    isPasswordSet: req.user?.isPasswordSet || false
                }
            }
        });
    }
    catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to load dashboard'
        });
    }
});
exports.default = router;
//# sourceMappingURL=user.js.map