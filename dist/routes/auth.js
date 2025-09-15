"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const models_1 = require("../models");
const jwt_1 = require("../utils/jwt");
const emailService_1 = __importDefault(require("../services/emailService"));
const express_validator_1 = require("express-validator");
const rateLimiter_1 = require("../middleware/rateLimiter");
const router = (0, express_1.Router)();
const handleValidation = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array()
        });
        return;
    }
    next();
};
const registerValidation = [
    (0, express_validator_1.body)('firstName').trim().isLength({ min: 2, max: 50 }).withMessage('First name must be between 2 and 50 characters'),
    (0, express_validator_1.body)('lastName').trim().isLength({ min: 2, max: 50 }).withMessage('Last name must be between 2 and 50 characters'),
    (0, express_validator_1.body)('email').isEmail().normalizeEmail().withMessage('Please provide a valid email address'),
    handleValidation
];
const loginValidation = [
    (0, express_validator_1.body)('email').isEmail().normalizeEmail().withMessage('Please provide a valid email address'),
    (0, express_validator_1.body)('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    handleValidation
];
const otpValidation = [
    (0, express_validator_1.body)('email').isEmail().normalizeEmail().withMessage('Please provide a valid email address'),
    (0, express_validator_1.body)('otp').isLength({ min: 4, max: 6 }).withMessage('OTP must be between 4 and 6 characters'),
    handleValidation
];
const passwordValidation = [
    (0, express_validator_1.body)('email').isEmail().normalizeEmail().withMessage('Please provide a valid email address'),
    (0, express_validator_1.body)('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    handleValidation
];
const emailValidation = [
    (0, express_validator_1.body)('email').isEmail().normalizeEmail().withMessage('Please provide a valid email address'),
    handleValidation
];
router.post('/register', rateLimiter_1.authLimiter, registerValidation, async (req, res) => {
    try {
        const { firstName, lastName, email } = req.body;
        const existingUser = await models_1.User.findOne({ email });
        if (existingUser) {
            if (existingUser.isEmailVerified) {
                res.status(409).json({
                    success: false,
                    message: 'User already exists with this email'
                });
                return;
            }
            else {
                await models_1.User.findByIdAndDelete(existingUser._id);
                await models_1.OTP.deleteMany({ email });
            }
        }
        const user = new models_1.User({
            firstName,
            lastName,
            email,
            isEmailVerified: false,
            isPasswordSet: false
        });
        await user.save();
        const otpDoc = await models_1.OTP.createOTP(email, 'email_verification', 10);
        await emailService_1.default.sendOTPEmail(email, otpDoc.otp, 'verification');
        res.status(201).json({
            success: true,
            message: 'Registration successful. Please check your email for OTP verification.',
            data: {
                email,
                expiresAt: otpDoc.expiresAt
            }
        });
    }
    catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Registration failed. Please try again.'
        });
    }
});
router.post('/verify-otp', rateLimiter_1.authLimiter, otpValidation, async (req, res) => {
    try {
        const { email, otp } = req.body;
        const otpResult = await models_1.OTP.verifyOTP(email, otp, 'email_verification');
        if (!otpResult.valid) {
            res.status(400).json({
                success: false,
                message: otpResult.message
            });
            return;
        }
        const user = await models_1.User.findOneAndUpdate({ email }, { isEmailVerified: true }, { new: true });
        if (!user) {
            res.status(404).json({
                success: false,
                message: 'User not found'
            });
            return;
        }
        res.json({
            success: true,
            message: 'Email verified successfully. Please set your password.',
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
        console.error('OTP verification error:', error);
        res.status(500).json({
            success: false,
            message: 'OTP verification failed. Please try again.'
        });
    }
});
router.post('/set-password', rateLimiter_1.authLimiter, passwordValidation, async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await models_1.User.findOne({ email }).select('+password');
        if (!user) {
            res.status(404).json({
                success: false,
                message: 'User not found'
            });
            return;
        }
        if (!user.isEmailVerified) {
            res.status(400).json({
                success: false,
                message: 'Email verification required before setting password'
            });
            return;
        }
        user.password = password;
        user.isPasswordSet = true;
        await user.save();
        const token = (0, jwt_1.generateToken)(user);
        res.json({
            success: true,
            message: 'Password set successfully. You can now login.',
            data: {
                token,
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
        console.error('Set password error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to set password. Please try again.'
        });
    }
});
router.post('/login', rateLimiter_1.authLimiter, loginValidation, async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await models_1.User.findOne({ email }).select('+password');
        if (!user) {
            res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
            return;
        }
        if (!user.isEmailVerified) {
            res.status(401).json({
                success: false,
                message: 'Please verify your email before logging in'
            });
            return;
        }
        if (!user.isPasswordSet || !user.password) {
            res.status(401).json({
                success: false,
                message: 'Please complete your registration by setting a password'
            });
            return;
        }
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
            return;
        }
        const token = (0, jwt_1.generateToken)(user);
        res.json({
            success: true,
            message: 'Login successful',
            data: {
                token,
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
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Login failed. Please try again.'
        });
    }
});
router.post('/forgot-password', rateLimiter_1.passwordResetLimiter, emailValidation, async (req, res) => {
    try {
        const { email } = req.body;
        const user = await models_1.User.findOne({ email });
        if (!user) {
            res.json({
                success: true,
                message: 'If an account with this email exists, you will receive a password reset OTP.'
            });
            return;
        }
        if (!user.isEmailVerified) {
            res.status(400).json({
                success: false,
                message: 'Email not verified. Please complete registration first.'
            });
            return;
        }
        const otpDoc = await models_1.OTP.createOTP(email, 'password_reset', 10);
        await emailService_1.default.sendOTPEmail(email, otpDoc.otp, 'password_reset');
        res.json({
            success: true,
            message: 'Password reset OTP sent to your email.',
            data: {
                email,
                expiresAt: otpDoc.expiresAt
            }
        });
    }
    catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send password reset OTP. Please try again.'
        });
    }
});
router.post('/verify-reset-otp', rateLimiter_1.authLimiter, otpValidation, async (req, res) => {
    try {
        const { email, otp } = req.body;
        const otpResult = await models_1.OTP.verifyOTP(email, otp, 'password_reset');
        if (!otpResult.valid) {
            res.status(400).json({
                success: false,
                message: otpResult.message
            });
            return;
        }
        res.json({
            success: true,
            message: 'OTP verified successfully. You can now reset your password.',
            data: {
                email
            }
        });
    }
    catch (error) {
        console.error('Reset OTP verification error:', error);
        res.status(500).json({
            success: false,
            message: 'OTP verification failed. Please try again.'
        });
    }
});
router.post('/reset-password', rateLimiter_1.authLimiter, passwordValidation, async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await models_1.User.findOne({ email }).select('+password');
        if (!user) {
            res.status(404).json({
                success: false,
                message: 'User not found'
            });
            return;
        }
        user.password = password;
        await user.save();
        res.json({
            success: true,
            message: 'Password reset successfully. You can now login with your new password.'
        });
    }
    catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to reset password. Please try again.'
        });
    }
});
router.post('/resend-otp', rateLimiter_1.otpLimiter, emailValidation, async (req, res) => {
    try {
        const { email } = req.body;
        const user = await models_1.User.findOne({ email });
        if (!user) {
            res.status(404).json({
                success: false,
                message: 'User not found'
            });
            return;
        }
        const otpType = user.isEmailVerified ? 'password_reset' : 'email_verification';
        const emailType = user.isEmailVerified ? 'password_reset' : 'verification';
        const otpDoc = await models_1.OTP.createOTP(email, otpType, 10);
        await emailService_1.default.sendOTPEmail(email, otpDoc.otp, emailType);
        res.json({
            success: true,
            message: 'New OTP sent to your email.',
            data: {
                email,
                expiresAt: otpDoc.expiresAt
            }
        });
    }
    catch (error) {
        console.error('Resend OTP error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to resend OTP. Please try again.'
        });
    }
});
exports.default = router;
//# sourceMappingURL=auth.js.map