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
const bulkParticipantController_1 = require("../controllers/bulkParticipantController");
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
    (0, express_validator_1.body)('type').optional().isIn(['email_verification', 'password_reset']).withMessage('Type must be either "email_verification" or "password_reset"'),
    handleValidation
];
const passwordValidation = [
    (0, express_validator_1.body)('email').isEmail().normalizeEmail().withMessage('Please provide a valid email address'),
    (0, express_validator_1.body)('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    (0, express_validator_1.body)('otp').optional().isLength({ min: 4, max: 6 }).withMessage('OTP must be between 4 and 6 characters'),
    handleValidation
];
const emailValidation = [
    (0, express_validator_1.body)('email').isEmail().normalizeEmail().withMessage('Please provide a valid email address'),
    handleValidation
];
router.post('/register', registerValidation, async (req, res) => {
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
router.post('/verify-otp', otpValidation, async (req, res) => {
    try {
        const { email, otp, type } = req.body;
        const user = await models_1.User.findOne({ email });
        if (!user) {
            res.status(404).json({
                success: false,
                message: 'User not found'
            });
            return;
        }
        let otpType;
        if (type) {
            if (type !== 'email_verification' && type !== 'password_reset') {
                res.status(400).json({
                    success: false,
                    message: 'Invalid OTP type. Must be either "email_verification" or "password_reset"'
                });
                return;
            }
            otpType = type;
        }
        else {
            otpType = user.isEmailVerified ? 'password_reset' : 'email_verification';
        }
        let otpResult;
        if (otpType === 'password_reset') {
            otpResult = await models_1.OTP.checkOTP(email, otp, otpType);
        }
        else {
            otpResult = await models_1.OTP.verifyOTP(email, otp, otpType);
        }
        if (!otpResult.valid) {
            res.status(400).json({
                success: false,
                message: otpResult.message
            });
            return;
        }
        let updatedUser = user;
        let message = '';
        let nextStep = '';
        if (otpType === 'email_verification') {
            updatedUser = await models_1.User.findOneAndUpdate({ email }, { isEmailVerified: true }, { new: true });
            message = 'Email verified successfully. Please set your password.';
            nextStep = 'set-password';
        }
        else {
            message = 'OTP verified successfully. You can now reset your password.';
            nextStep = 'set-password';
        }
        if (!updatedUser) {
            res.status(404).json({
                success: false,
                message: 'User not found'
            });
            return;
        }
        res.json({
            success: true,
            message,
            data: {
                otpType,
                nextStep,
                user: {
                    id: updatedUser._id.toString(),
                    firstName: updatedUser.firstName,
                    lastName: updatedUser.lastName,
                    email: updatedUser.email,
                    role: updatedUser.role,
                    isEmailVerified: updatedUser.isEmailVerified,
                    isPasswordSet: updatedUser.isPasswordSet
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
router.post('/set-password', passwordValidation, async (req, res) => {
    try {
        const { email, password, otp } = req.body;
        const user = await models_1.User.findOne({ email }).select('+password');
        if (!user) {
            res.status(404).json({
                success: false,
                message: 'User not found'
            });
            return;
        }
        if (otp) {
            const otpType = user.isEmailVerified ? 'password_reset' : 'email_verification';
            const otpResult = await models_1.OTP.verifyOTP(email, otp, otpType);
            if (!otpResult.valid) {
                res.status(400).json({
                    success: false,
                    message: otpResult.message
                });
                return;
            }
            if (otpType === 'email_verification') {
                user.isEmailVerified = true;
            }
        }
        else {
            if (!user.isEmailVerified) {
                res.status(400).json({
                    success: false,
                    message: 'Email verification required before setting password. Please provide OTP.'
                });
                return;
            }
        }
        user.password = password;
        user.isPasswordSet = true;
        await user.save();
        const token = (0, jwt_1.generateToken)(user);
        const isPasswordReset = user.isPasswordSet && otp;
        const message = isPasswordReset
            ? 'Password reset successfully. You can now login with your new password.'
            : 'Password set successfully. You can now login.';
        res.json({
            success: true,
            message,
            data: {
                token,
                user: {
                    id: user._id.toString(),
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    role: user.role,
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
router.post('/login', loginValidation, async (req, res) => {
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
        const userResponse = {
            id: user._id.toString(),
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role,
            isEmailVerified: user.isEmailVerified,
            isPasswordSet: user.isPasswordSet
        };
        if (user.role === 'contestant') {
            const registration = await models_1.Registration.findOne({ userId: user._id });
            if (registration) {
                const stepNames = {
                    0: 'not_started',
                    1: 'personal_info',
                    2: 'talent_info',
                    3: 'group_info',
                    4: 'guardian_info',
                    5: 'media_info',
                    6: 'audition_info',
                    7: 'terms_conditions',
                    8: 'payment'
                };
                const requiredSteps = registration.registrationType === 'individual' ?
                    [1, 2, 4, 5, 6, 7, 8] :
                    [1, 2, 3, 5, 6, 7, 8];
                const allRequiredStepsCompleted = requiredSteps.every(step => registration.completedSteps.includes(step));
                const registrationComplete = allRequiredStepsCompleted &&
                    registration.status === 'submitted' &&
                    registration.paymentInfo.paymentStatus === 'completed';
                const completedSteps = registration.completedSteps.sort((a, b) => b - a);
                const lastStep = completedSteps.length > 0 ? completedSteps[0] : 0;
                const lastStepName = stepNames[lastStep] || 'unknown';
                const currentStep = registration.currentStep;
                const currentStepName = stepNames[currentStep] || 'unknown';
                userResponse.registrationInfo = {
                    currentStep,
                    currentStepName,
                    lastStep,
                    lastStepName,
                    registrationComplete,
                    registrationStatus: registration.status,
                    paymentStatus: registration.paymentInfo.paymentStatus,
                    completedSteps: registration.completedSteps,
                    registrationNumber: registration.registrationNumber,
                    registrationType: registration.registrationType
                };
            }
            else {
                userResponse.registrationInfo = {
                    currentStep: 0,
                    currentStepName: 'not_started',
                    lastStep: 0,
                    lastStepName: 'not_started',
                    registrationComplete: false,
                    registrationStatus: null,
                    paymentStatus: null,
                    completedSteps: [],
                    registrationNumber: null,
                    registrationType: null
                };
            }
        }
        res.json({
            success: true,
            message: 'Login successful',
            data: {
                token,
                user: userResponse
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
router.post('/forgot-password', emailValidation, async (req, res) => {
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
router.post('/resend-otp', emailValidation, async (req, res) => {
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
router.post('/bulk-participant/verify', [
    (0, express_validator_1.body)('email').isEmail().withMessage('Please provide a valid email'),
    (0, express_validator_1.body)('otp').isLength({ min: 4, max: 8 }).withMessage('OTP must be 4-8 characters'),
    (0, express_validator_1.body)('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    (0, express_validator_1.body)('confirmPassword').notEmpty().withMessage('Password confirmation is required'),
    handleValidation
], bulkParticipantController_1.verifyBulkParticipantOTP);
router.get('/bulk-participant/status/:email', bulkParticipantController_1.checkBulkParticipantStatus);
exports.default = router;
//# sourceMappingURL=auth.js.map