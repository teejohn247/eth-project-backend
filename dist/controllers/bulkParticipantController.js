"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkBulkParticipantStatus = exports.verifyBulkParticipantOTP = void 0;
const models_1 = require("../models");
const jwt_1 = require("../utils/jwt");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const verifyBulkParticipantOTP = async (req, res) => {
    try {
        const { email, otp, password, confirmPassword } = req.body;
        if (!email || !otp || !password || !confirmPassword) {
            res.status(400).json({
                success: false,
                message: 'Email, OTP, password, and confirm password are required'
            });
            return;
        }
        if (password !== confirmPassword) {
            res.status(400).json({
                success: false,
                message: 'Passwords do not match'
            });
            return;
        }
        const bulkRegistration = await models_1.BulkRegistration.findOne({
            'participants.email': email
        });
        if (!bulkRegistration) {
            res.status(404).json({
                success: false,
                message: 'No bulk registration invitation found for this email'
            });
            return;
        }
        const participant = bulkRegistration.participants.find(p => p.email === email);
        if (!participant) {
            res.status(404).json({
                success: false,
                message: 'Participant not found'
            });
            return;
        }
        if (participant.participantId) {
            res.status(400).json({
                success: false,
                message: 'This participant has already completed registration'
            });
            return;
        }
        const isValidOTP = await models_1.OTP.verifyOTP(email, otp, 'email_verification');
        if (!isValidOTP) {
            res.status(400).json({
                success: false,
                message: 'Invalid or expired OTP'
            });
            return;
        }
        const existingUser = await models_1.User.findOne({ email });
        if (existingUser) {
            res.status(400).json({
                success: false,
                message: 'User with this email already exists'
            });
            return;
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, 12);
        const newUser = new models_1.User({
            firstName: participant.firstName,
            lastName: participant.lastName,
            email: participant.email,
            password: hashedPassword,
            role: 'contestant',
            isActive: true,
            emailVerified: true,
            emailVerifiedAt: new Date(),
            lastLogin: new Date()
        });
        await newUser.save();
        const registration = new models_1.Registration({
            userId: newUser._id,
            registrationType: 'individual',
            isBulkParticipant: true,
            bulkRegistrationId: bulkRegistration._id
        });
        await registration.save();
        participant.participantId = newUser._id;
        participant.registrationId = registration._id;
        participant.invitationStatus = 'registered';
        participant.registeredAt = new Date();
        await bulkRegistration.save();
        const token = (0, jwt_1.generateToken)(newUser);
        res.status(201).json({
            success: true,
            message: 'Account created successfully. Your registration slot is already paid for!',
            data: {
                token,
                user: {
                    id: newUser._id,
                    firstName: newUser.firstName,
                    lastName: newUser.lastName,
                    email: newUser.email,
                    role: newUser.role
                },
                registration: {
                    registrationId: registration._id,
                    registrationNumber: registration.registrationNumber,
                    currentStep: registration.currentStep,
                    status: registration.status,
                    isBulkParticipant: registration.isBulkParticipant,
                    bulkRegistrationNumber: bulkRegistration.bulkRegistrationNumber,
                    paymentRequired: false
                }
            }
        });
    }
    catch (error) {
        console.error('Verify bulk participant OTP error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to verify OTP and create account',
            error: process.env.NODE_ENV === 'development' ? error : undefined
        });
    }
};
exports.verifyBulkParticipantOTP = verifyBulkParticipantOTP;
const checkBulkParticipantStatus = async (req, res) => {
    try {
        const { email } = req.params;
        if (!email) {
            res.status(400).json({
                success: false,
                message: 'Email is required'
            });
            return;
        }
        const bulkRegistration = await models_1.BulkRegistration.findOne({
            'participants.email': email
        }).populate('participants.participantId', 'firstName lastName email')
            .populate('participants.registrationId', 'registrationNumber status currentStep');
        if (!bulkRegistration) {
            res.status(404).json({
                success: false,
                message: 'No bulk registration invitation found for this email'
            });
            return;
        }
        const participant = bulkRegistration.participants.find(p => p.email === email);
        if (!participant) {
            res.status(404).json({
                success: false,
                message: 'Participant not found'
            });
            return;
        }
        res.status(200).json({
            success: true,
            message: 'Bulk participant status retrieved successfully',
            data: {
                email: participant.email,
                firstName: participant.firstName,
                lastName: participant.lastName,
                invitationStatus: participant.invitationStatus,
                invitationSentAt: participant.invitationSentAt,
                registeredAt: participant.registeredAt,
                bulkRegistrationNumber: bulkRegistration.bulkRegistrationNumber,
                hasAccount: !!participant.participantId,
                hasRegistration: !!participant.registrationId,
                participantId: participant.participantId,
                registrationId: participant.registrationId
            }
        });
    }
    catch (error) {
        console.error('Check bulk participant status error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to check participant status',
            error: process.env.NODE_ENV === 'development' ? error : undefined
        });
    }
};
exports.checkBulkParticipantStatus = checkBulkParticipantStatus;
//# sourceMappingURL=bulkParticipantController.js.map