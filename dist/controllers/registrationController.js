"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteRegistration = exports.getRegistrationStatus = exports.updateTermsConditions = exports.updateAuditionInfo = exports.updateMediaInfo = exports.updateGuardianInfo = exports.updateGroupInfo = exports.updateTalentInfo = exports.updatePersonalInfo = exports.submitRegistration = exports.updateRegistration = exports.getRegistration = exports.addParticipantToRegistration = exports.processBulkPayment = exports.addBulkSlots = exports.createRegistration = exports.getUserRegistrations = void 0;
const Registration_1 = __importDefault(require("../models/Registration"));
const AuditionSchedule_1 = __importDefault(require("../models/AuditionSchedule"));
const mongoose_1 = __importDefault(require("mongoose"));
const cloudinaryService_1 = __importDefault(require("../services/cloudinaryService"));
const findRegistrationByIdOrUserId = async (idParam, userId) => {
    const isValidObjectId = mongoose_1.default.Types.ObjectId.isValid(idParam);
    let registration;
    if (isValidObjectId) {
        registration = await Registration_1.default.findOne({
            _id: idParam,
            userId: userId
        }).populate('paidBy', 'firstName lastName email role');
    }
    if (!registration) {
        if (mongoose_1.default.Types.ObjectId.isValid(idParam)) {
            registration = await Registration_1.default.findOne({
                userId: idParam
            }).populate('paidBy', 'firstName lastName email role');
            if (registration && registration.userId.toString() !== userId && idParam !== userId) {
                return null;
            }
        }
        else {
            registration = await Registration_1.default.findOne({
                userId: userId
            }).populate('paidBy', 'firstName lastName email role');
        }
    }
    return registration;
};
const getUserRegistrations = async (req, res) => {
    try {
        const registrations = await Registration_1.default.find({ userId: req.user?.userId })
            .populate('paidBy', 'firstName lastName email role')
            .sort({ createdAt: -1 })
            .select('-paymentInfo.paymentResponse');
        const enrichedRegistrations = await Promise.all(registrations.map(async (registration) => {
            const registrationData = registration.toObject();
            if (registrationData.paidBy) {
                registrationData.sponsor = registrationData.paidBy;
                delete registrationData.paidBy;
            }
            if ((registration.registrationType === 'bulk' && registration.bulkRegistrationId) ||
                (registration.isBulkParticipant && registration.bulkRegistrationId)) {
                try {
                    const { BulkRegistration } = await Promise.resolve().then(() => __importStar(require('../models')));
                    const bulkRegistration = await BulkRegistration.findById(registration.bulkRegistrationId);
                    if (bulkRegistration) {
                        registrationData.bulkRegistration = {
                            bulkRegistrationId: bulkRegistration._id,
                            bulkRegistrationNumber: bulkRegistration.bulkRegistrationNumber,
                            totalSlots: bulkRegistration.totalSlots,
                            usedSlots: bulkRegistration.usedSlots,
                            availableSlots: bulkRegistration.availableSlots,
                            status: bulkRegistration.status,
                            owner: {
                                ownerId: bulkRegistration.ownerId
                            },
                            paymentInfo: {
                                paymentStatus: bulkRegistration.paymentInfo.paymentStatus,
                                paymentReference: bulkRegistration.paymentInfo.paymentReference,
                                transactionId: bulkRegistration.paymentInfo.transactionId,
                                paymentMethod: bulkRegistration.paymentInfo.paymentMethod,
                                paidAt: bulkRegistration.paymentInfo.paidAt,
                                amount: bulkRegistration.totalAmount,
                                currency: bulkRegistration.currency,
                                pricePerSlot: bulkRegistration.pricePerSlot
                            },
                            participants: bulkRegistration.participants.map(p => ({
                                firstName: p.firstName,
                                lastName: p.lastName,
                                email: p.email,
                                phoneNo: p.phoneNo,
                                invitationStatus: p.invitationStatus,
                                invitationSentAt: p.invitationSentAt,
                                registeredAt: p.registeredAt,
                                addedAt: p.addedAt,
                                hasAccount: !!p.participantId,
                                hasRegistration: !!p.registrationId
                            })),
                            canAddParticipants: bulkRegistration.status === 'active' && bulkRegistration.availableSlots > 0,
                            nextStep: bulkRegistration.status === 'active' ? 'add_participants' : 'payment'
                        };
                    }
                }
                catch (error) {
                    console.error('Failed to fetch bulk registration info:', error);
                }
            }
            return registrationData;
        }));
        res.status(200).json({
            success: true,
            message: 'Registrations retrieved successfully',
            data: enrichedRegistrations
        });
    }
    catch (error) {
        console.error('Get registrations error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve registrations',
            error: process.env.NODE_ENV === 'development' ? error : undefined
        });
    }
};
exports.getUserRegistrations = getUserRegistrations;
const createRegistration = async (req, res) => {
    try {
        const { registrationType } = req.body;
        const existingRegistration = await Registration_1.default.findOne({
            userId: req.user?.userId,
            status: { $in: ['draft', 'submitted', 'under_review', 'approved'] }
        });
        if (existingRegistration) {
            res.status(400).json({
                success: false,
                message: 'You already have an active registration'
            });
            return;
        }
        const registration = new Registration_1.default({
            userId: req.user?.userId,
            registrationType,
            paidBy: req.user?.userId
        });
        await registration.save();
        res.status(201).json({
            success: true,
            message: 'Registration created successfully',
            data: {
                ...registration.toObject(),
                nextStep: registrationType === 'bulk' ? 'slot_selection' : 'personal_info',
                isBulk: registrationType === 'bulk',
                pricePerSlot: registrationType === 'bulk' ? 10000 : undefined,
                bulkSlotEndpoint: registrationType === 'bulk' ? `/api/v1/registrations/${registration._id}/bulk-slots` : undefined
            }
        });
    }
    catch (error) {
        console.error('Create registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create registration',
            error: process.env.NODE_ENV === 'development' ? error : undefined
        });
    }
};
exports.createRegistration = createRegistration;
const addBulkSlots = async (req, res) => {
    try {
        const { id } = req.params;
        const { totalSlots } = req.body;
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ success: false, message: 'Unauthorized: User ID not found in token' });
            return;
        }
        if (!totalSlots || totalSlots < 2 || totalSlots > 50) {
            res.status(400).json({
                success: false,
                message: 'Total slots must be between 2 and 50'
            });
            return;
        }
        const registration = await findRegistrationByIdOrUserId(id, userId);
        if (!registration) {
            res.status(404).json({
                success: false,
                message: 'Registration not found'
            });
            return;
        }
        if (registration.registrationType !== 'bulk') {
            res.status(400).json({
                success: false,
                message: 'This endpoint is only for bulk registrations'
            });
            return;
        }
        if (registration.bulkRegistrationId) {
            const { BulkRegistration } = await Promise.resolve().then(() => __importStar(require('../models')));
            const existingBulkRegistration = await BulkRegistration.findById(registration.bulkRegistrationId);
            if (existingBulkRegistration) {
                res.status(400).json({
                    success: false,
                    message: 'This registration already has bulk slots configured.'
                });
                return;
            }
            else {
                registration.bulkRegistrationId = undefined;
                await registration.save();
            }
        }
        const pricePerSlot = 10000;
        const totalAmount = totalSlots * pricePerSlot;
        const { BulkRegistration } = await Promise.resolve().then(() => __importStar(require('../models')));
        const bulkRegistration = new BulkRegistration({
            ownerId: userId,
            totalSlots,
            pricePerSlot,
            totalAmount,
            currency: 'NGN',
            status: 'payment_pending',
            participants: []
        });
        await bulkRegistration.save();
        registration.bulkRegistrationId = bulkRegistration._id;
        registration.paymentInfo = {
            amount: totalAmount,
            currency: 'NGN',
            paymentStatus: 'pending',
            paymentReference: '',
            transactionId: '',
            paymentMethod: '',
            paidAt: undefined,
            paymentResponse: {}
        };
        await registration.save();
        res.status(201).json({
            success: true,
            message: 'Bulk slots added successfully. Proceed to payment.',
            data: {
                registrationId: registration._id,
                registrationNumber: registration.registrationNumber,
                bulkRegistrationId: bulkRegistration._id,
                bulkRegistrationNumber: bulkRegistration.bulkRegistrationNumber,
                totalSlots: bulkRegistration.totalSlots,
                pricePerSlot: bulkRegistration.pricePerSlot,
                totalAmount: bulkRegistration.totalAmount,
                currency: bulkRegistration.currency,
                status: bulkRegistration.status,
                paymentInfo: {
                    paymentStatus: bulkRegistration.paymentInfo.paymentStatus,
                    amount: totalAmount,
                    currency: 'NGN'
                },
                nextStep: 'payment',
                paymentEndpoint: `/api/v1/registrations/${registration._id}/bulk-payment`
            }
        });
    }
    catch (error) {
        console.error('Add bulk slots error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add bulk slots',
            error: process.env.NODE_ENV === 'development' ? error : undefined
        });
    }
};
exports.addBulkSlots = addBulkSlots;
const processBulkPayment = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.userId;
        const paymentData = req.body;
        if (!userId) {
            res.status(401).json({ success: false, message: 'Unauthorized: User ID not found in token' });
            return;
        }
        const registration = await findRegistrationByIdOrUserId(id, userId);
        if (!registration) {
            res.status(404).json({
                success: false,
                message: 'Registration not found'
            });
            return;
        }
        if (registration.registrationType !== 'bulk') {
            res.status(400).json({
                success: false,
                message: 'This endpoint is only for bulk registrations'
            });
            return;
        }
        if (!registration.bulkRegistrationId) {
            res.status(400).json({
                success: false,
                message: 'No bulk registration found. Please add slots first.'
            });
            return;
        }
        const { BulkRegistration } = await Promise.resolve().then(() => __importStar(require('../models')));
        const bulkRegistration = await BulkRegistration.findById(registration.bulkRegistrationId);
        if (!bulkRegistration) {
            res.status(404).json({
                success: false,
                message: 'Bulk registration not found'
            });
            return;
        }
        const transAmount = paymentData.transAmount || paymentData.amount || bulkRegistration.totalAmount;
        let mappedStatus = 'pending';
        const statusValue = paymentData.status || paymentData.transaction_status || paymentData.paymentStatus;
        if (statusValue === '0' || statusValue === 0 ||
            statusValue === 'successful' || statusValue === 'success' ||
            statusValue === 'completed' || statusValue === 'paid') {
            mappedStatus = 'completed';
        }
        else if (statusValue === '1' || statusValue === 1 ||
            statusValue === 'failed' || statusValue === 'failure' ||
            statusValue === 'declined' || statusValue === 'error') {
            mappedStatus = 'failed';
        }
        else if (statusValue === 'processing' || statusValue === 'pending') {
            mappedStatus = 'processing';
        }
        bulkRegistration.paymentInfo = {
            paymentStatus: mappedStatus,
            paymentReference: paymentData.reference || paymentData.paymentReference || paymentData.transaction_reference,
            transactionId: paymentData.transactionId || paymentData.transaction_id || paymentData.id,
            paymentMethod: paymentData.paymentMethod || paymentData.payment_method || paymentData.channel,
            paidAt: mappedStatus === 'completed' ? new Date() : undefined,
            paymentResponse: paymentData
        };
        if (mappedStatus === 'completed') {
            bulkRegistration.status = 'active';
            try {
                const { User } = await Promise.resolve().then(() => __importStar(require('../models')));
                await User.findByIdAndUpdate(userId, { role: 'sponsor' });
                console.log(`✅ Updated user ${userId} role to sponsor after bulk payment`);
            }
            catch (error) {
                console.error('Failed to update user role to sponsor:', error);
            }
        }
        else if (mappedStatus === 'failed') {
            bulkRegistration.status = 'payment_pending';
        }
        await bulkRegistration.save();
        registration.paymentInfo = {
            amount: transAmount,
            currency: 'NGN',
            paymentStatus: mappedStatus,
            paymentReference: paymentData.reference || paymentData.paymentReference || paymentData.transaction_reference,
            transactionId: paymentData.transactionId || paymentData.transaction_id || paymentData.id,
            paymentMethod: paymentData.paymentMethod || paymentData.payment_method || paymentData.channel,
            paidAt: mappedStatus === 'completed' ? new Date() : undefined,
            paymentResponse: paymentData
        };
        await registration.save();
        res.status(200).json({
            success: true,
            message: mappedStatus === 'completed'
                ? 'Bulk payment processed successfully. You can now add participants.'
                : 'Payment status updated.',
            data: {
                registrationId: registration._id,
                registrationNumber: registration.registrationNumber,
                bulkRegistrationId: bulkRegistration._id,
                bulkRegistrationNumber: bulkRegistration.bulkRegistrationNumber,
                paymentStatus: bulkRegistration.paymentInfo.paymentStatus,
                status: bulkRegistration.status,
                totalSlots: bulkRegistration.totalSlots,
                availableSlots: bulkRegistration.availableSlots,
                canAddParticipants: bulkRegistration.status === 'active',
                nextStep: mappedStatus === 'completed' ? 'add_participants' : 'payment',
                addParticipantEndpoint: mappedStatus === 'completed' ? `/api/v1/registrations/${registration._id}/participants` : undefined
            }
        });
    }
    catch (error) {
        console.error('Process bulk payment error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to process bulk payment',
            error: process.env.NODE_ENV === 'development' ? error : undefined
        });
    }
};
exports.processBulkPayment = processBulkPayment;
const addParticipantToRegistration = async (req, res) => {
    try {
        const { id } = req.params;
        const { firstName, lastName, email, phoneNo } = req.body;
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ success: false, message: 'Unauthorized: User ID not found in token' });
            return;
        }
        if (!firstName || !lastName || !email) {
            res.status(400).json({
                success: false,
                message: 'First name, last name, and email are required'
            });
            return;
        }
        const registration = await findRegistrationByIdOrUserId(id, userId);
        if (!registration) {
            res.status(404).json({
                success: false,
                message: 'Registration not found'
            });
            return;
        }
        if (registration.registrationType !== 'bulk') {
            res.status(400).json({
                success: false,
                message: 'This endpoint is only for bulk registrations'
            });
            return;
        }
        if (!registration.bulkRegistrationId) {
            res.status(400).json({
                success: false,
                message: 'No bulk registration found. Please add slots and complete payment first.'
            });
            return;
        }
        const { BulkRegistration, User, OTP } = await Promise.resolve().then(() => __importStar(require('../models')));
        const bulkRegistration = await BulkRegistration.findById(registration.bulkRegistrationId);
        if (!bulkRegistration) {
            res.status(404).json({
                success: false,
                message: 'Bulk registration not found'
            });
            return;
        }
        if (bulkRegistration.status !== 'active') {
            res.status(400).json({
                success: false,
                message: 'Payment must be completed before adding participants'
            });
            return;
        }
        if (bulkRegistration.availableSlots <= 0) {
            res.status(400).json({
                success: false,
                message: 'No available slots remaining'
            });
            return;
        }
        const existingParticipant = bulkRegistration.participants.find(p => p.email === email);
        if (existingParticipant) {
            res.status(400).json({
                success: false,
                message: 'Email already used for another participant in this bulk registration'
            });
            return;
        }
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            res.status(400).json({
                success: false,
                message: 'Email already registered in the system'
            });
            return;
        }
        const otpDoc = await OTP.createOTP(email, 'email_verification', 10);
        bulkRegistration.participants.push({
            firstName,
            lastName,
            email,
            phoneNo,
            invitationStatus: 'pending',
            otpToken: otpDoc.otp,
            otpExpiresAt: otpDoc.expiresAt,
            addedAt: new Date()
        });
        bulkRegistration.usedSlots += 1;
        await bulkRegistration.save();
        try {
            const emailService = await Promise.resolve().then(() => __importStar(require('../services/emailService')));
            await emailService.default.sendBulkParticipantInvitation(email, otpDoc.otp, firstName, bulkRegistration.bulkRegistrationNumber);
            const participant = bulkRegistration.participants.find(p => p.email === email);
            if (participant) {
                participant.invitationStatus = 'sent';
                participant.invitationSentAt = new Date();
                await bulkRegistration.save();
            }
        }
        catch (emailError) {
            console.error('Failed to send invitation email:', emailError);
        }
        res.status(201).json({
            success: true,
            message: 'Participant added successfully. Invitation email sent.',
            data: {
                registrationId: registration._id,
                registrationNumber: registration.registrationNumber,
                bulkRegistrationId: bulkRegistration._id,
                bulkRegistrationNumber: bulkRegistration.bulkRegistrationNumber,
                participantEmail: email,
                participantName: `${firstName} ${lastName}`,
                availableSlots: bulkRegistration.availableSlots,
                usedSlots: bulkRegistration.usedSlots,
                totalSlots: bulkRegistration.totalSlots
            }
        });
    }
    catch (error) {
        console.error('Add participant to registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add participant',
            error: process.env.NODE_ENV === 'development' ? error : undefined
        });
    }
};
exports.addParticipantToRegistration = addParticipantToRegistration;
const getRegistration = async (req, res) => {
    try {
        const { id } = req.params;
        const registration = await findRegistrationByIdOrUserId(id, req.user?.userId);
        if (!registration) {
            res.status(404).json({
                success: false,
                message: 'Registration not found'
            });
            return;
        }
        const registrationData = registration.toObject();
        if (registrationData.paymentInfo?.paymentResponse) {
            delete registrationData.paymentInfo.paymentResponse;
        }
        if (registrationData.paidBy) {
            registrationData.sponsor = registrationData.paidBy;
            delete registrationData.paidBy;
        }
        if ((registration.registrationType === 'bulk' && registration.bulkRegistrationId) ||
            (registration.isBulkParticipant && registration.bulkRegistrationId)) {
            try {
                const { BulkRegistration } = await Promise.resolve().then(() => __importStar(require('../models')));
                const bulkRegistration = await BulkRegistration.findById(registration.bulkRegistrationId);
                if (bulkRegistration) {
                    registrationData.bulkRegistration = {
                        bulkRegistrationId: bulkRegistration._id,
                        bulkRegistrationNumber: bulkRegistration.bulkRegistrationNumber,
                        totalSlots: bulkRegistration.totalSlots,
                        usedSlots: bulkRegistration.usedSlots,
                        availableSlots: bulkRegistration.availableSlots,
                        status: bulkRegistration.status,
                        owner: {
                            ownerId: bulkRegistration.ownerId
                        },
                        paymentInfo: {
                            paymentStatus: bulkRegistration.paymentInfo.paymentStatus,
                            paymentReference: bulkRegistration.paymentInfo.paymentReference,
                            transactionId: bulkRegistration.paymentInfo.transactionId,
                            paymentMethod: bulkRegistration.paymentInfo.paymentMethod,
                            paidAt: bulkRegistration.paymentInfo.paidAt,
                            amount: bulkRegistration.totalAmount,
                            currency: bulkRegistration.currency,
                            pricePerSlot: bulkRegistration.pricePerSlot
                        },
                        participants: bulkRegistration.participants.map(p => ({
                            firstName: p.firstName,
                            lastName: p.lastName,
                            email: p.email,
                            phoneNo: p.phoneNo,
                            invitationStatus: p.invitationStatus,
                            invitationSentAt: p.invitationSentAt,
                            registeredAt: p.registeredAt,
                            addedAt: p.addedAt,
                            hasAccount: !!p.participantId,
                            hasRegistration: !!p.registrationId
                        })),
                        canAddParticipants: bulkRegistration.status === 'active' && bulkRegistration.availableSlots > 0,
                        nextStep: bulkRegistration.status === 'active' ? 'add_participants' : 'payment',
                        addParticipantEndpoint: bulkRegistration.status === 'active' ?
                            `/api/v1/registrations/${registration._id}/participants` : undefined
                    };
                }
            }
            catch (error) {
                console.error('Failed to fetch bulk registration info for get registration:', error);
            }
        }
        res.status(200).json({
            success: true,
            message: 'Registration retrieved successfully',
            data: [registrationData]
        });
    }
    catch (error) {
        console.error('Get registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve registration',
            error: process.env.NODE_ENV === 'development' ? error : undefined
        });
    }
};
exports.getRegistration = getRegistration;
const updateRegistration = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        const registration = await findRegistrationByIdOrUserId(id, req.user?.userId);
        if (!registration) {
            res.status(404).json({
                success: false,
                message: 'Registration not found'
            });
            return;
        }
        if (registration.status !== 'draft') {
            res.status(400).json({
                success: false,
                message: 'Cannot update a submitted registration'
            });
            return;
        }
        Object.assign(registration, updateData);
        await registration.save();
        res.status(200).json({
            success: true,
            message: 'Registration updated successfully',
            data: registration
        });
    }
    catch (error) {
        console.error('Update registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update registration',
            error: process.env.NODE_ENV === 'development' ? error : undefined
        });
    }
};
exports.updateRegistration = updateRegistration;
const submitRegistration = async (req, res) => {
    try {
        const { id } = req.params;
        const registration = await findRegistrationByIdOrUserId(id, req.user?.userId);
        if (!registration) {
            res.status(404).json({
                success: false,
                message: 'Registration not found'
            });
            return;
        }
        if (registration.status !== 'draft') {
            res.status(400).json({
                success: false,
                message: 'Registration has already been submitted'
            });
            return;
        }
        const requiredSteps = registration.registrationType === 'individual' ?
            [1, 2, 4, 6] :
            [1, 2, 3, 6];
        const missingSteps = requiredSteps.filter(step => !registration.completedSteps.includes(step));
        if (missingSteps.length > 0) {
            res.status(400).json({
                success: false,
                message: 'Please complete all required steps before submission',
                missingSteps
            });
            return;
        }
        if (!registration.isBulkParticipant && registration.paymentInfo.paymentStatus !== 'completed') {
            res.status(400).json({
                success: false,
                message: 'Payment must be completed before submission'
            });
            return;
        }
        registration.status = 'submitted';
        registration.submittedAt = new Date();
        await registration.save();
        if (registration.isBulkParticipant && registration.bulkRegistrationId) {
            try {
                const { BulkRegistration } = await Promise.resolve().then(() => __importStar(require('../models')));
                const bulkRegistration = await BulkRegistration.findById(registration.bulkRegistrationId);
                if (bulkRegistration) {
                    const participant = bulkRegistration.participants.find(p => p.registrationId?.toString() === registration._id.toString());
                    if (participant) {
                        participant.invitationStatus = 'completed';
                        await bulkRegistration.save();
                        const allParticipantsCompleted = bulkRegistration.participants.every(p => p.invitationStatus === 'completed');
                        if (allParticipantsCompleted) {
                            bulkRegistration.status = 'completed';
                            await bulkRegistration.save();
                            const ownerBulkRegistration = await Registration_1.default.findOne({
                                userId: bulkRegistration.ownerId,
                                registrationType: 'bulk',
                                bulkRegistrationId: bulkRegistration._id
                            });
                            if (ownerBulkRegistration && ownerBulkRegistration.status === 'draft') {
                                ownerBulkRegistration.status = 'submitted';
                                ownerBulkRegistration.submittedAt = new Date();
                                await ownerBulkRegistration.save();
                            }
                        }
                    }
                }
            }
            catch (error) {
                console.error('Failed to update bulk participant status:', error);
            }
        }
        res.status(200).json({
            success: true,
            message: 'Registration submitted successfully',
            data: registration
        });
    }
    catch (error) {
        console.error('Submit registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to submit registration',
            error: process.env.NODE_ENV === 'development' ? error : undefined
        });
    }
};
exports.submitRegistration = submitRegistration;
const updatePersonalInfo = async (req, res) => {
    try {
        const { id } = req.params;
        const { nextStep, ...personalInfo } = req.body;
        const foundRegistration = await findRegistrationByIdOrUserId(id, req.user?.userId);
        if (!foundRegistration) {
            res.status(404).json({
                success: false,
                message: 'Registration not found'
            });
            return;
        }
        const currentStepToSet = nextStep || 1;
        const updateObject = {
            $addToSet: { completedSteps: 1 },
            currentStep: currentStepToSet
        };
        Object.keys(personalInfo).forEach(key => {
            if (personalInfo[key] !== undefined) {
                updateObject[`personalInfo.${key}`] = personalInfo[key];
            }
        });
        const registration = await Registration_1.default.findOneAndUpdate({ _id: foundRegistration._id, userId: req.user?.userId }, updateObject, { new: true });
        if (!registration) {
            res.status(404).json({
                success: false,
                message: 'Registration not found'
            });
            return;
        }
        res.status(200).json({
            success: true,
            message: 'Personal information updated successfully',
            data: registration
        });
    }
    catch (error) {
        console.error('Update personal info error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update personal information',
            error: process.env.NODE_ENV === 'development' ? error : undefined
        });
    }
};
exports.updatePersonalInfo = updatePersonalInfo;
const updateTalentInfo = async (req, res) => {
    try {
        const { id } = req.params;
        const { nextStep, ...talentInfo } = req.body;
        const foundRegistration = await findRegistrationByIdOrUserId(id, req.user?.userId);
        if (!foundRegistration) {
            res.status(404).json({
                success: false,
                message: 'Registration not found'
            });
            return;
        }
        const currentStepToSet = nextStep || 2;
        const updateObject = {
            $addToSet: { completedSteps: 2 },
            currentStep: currentStepToSet
        };
        Object.keys(talentInfo).forEach(key => {
            if (talentInfo[key] !== undefined) {
                updateObject[`talentInfo.${key}`] = talentInfo[key];
            }
        });
        const registration = await Registration_1.default.findOneAndUpdate({ _id: foundRegistration._id, userId: req.user?.userId }, updateObject, { new: true });
        if (!registration) {
            res.status(404).json({
                success: false,
                message: 'Registration not found'
            });
            return;
        }
        res.status(200).json({
            success: true,
            message: 'Talent information updated successfully',
            data: registration
        });
    }
    catch (error) {
        console.error('Update talent info error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update talent information',
            error: process.env.NODE_ENV === 'development' ? error : undefined
        });
    }
};
exports.updateTalentInfo = updateTalentInfo;
const updateGroupInfo = async (req, res) => {
    try {
        const { id } = req.params;
        const { nextStep, ...bodyData } = req.body;
        let groupInfo = bodyData;
        if (groupInfo.members && Array.isArray(groupInfo.members)) {
            groupInfo.members = groupInfo.members.map((member) => ({
                ...member,
                tshirtSize: member.tshirtSize ? member.tshirtSize.toUpperCase() : member.tshirtSize
            }));
        }
        if (groupInfo.noOfGroupMembers && typeof groupInfo.noOfGroupMembers === 'string') {
            groupInfo.noOfGroupMembers = parseInt(groupInfo.noOfGroupMembers, 10);
        }
        const foundRegistration = await findRegistrationByIdOrUserId(id, req.user?.userId);
        if (!foundRegistration) {
            res.status(404).json({
                success: false,
                message: 'Registration not found'
            });
            return;
        }
        const currentStepToSet = nextStep || 3;
        const updateObject = {
            $addToSet: { completedSteps: 3 },
            currentStep: currentStepToSet
        };
        Object.keys(groupInfo).forEach(key => {
            if (groupInfo[key] !== undefined) {
                updateObject[`groupInfo.${key}`] = groupInfo[key];
            }
        });
        const registration = await Registration_1.default.findOneAndUpdate({ _id: foundRegistration._id, userId: req.user?.userId }, updateObject, { new: true });
        if (!registration) {
            res.status(404).json({
                success: false,
                message: 'Registration not found'
            });
            return;
        }
        res.status(200).json({
            success: true,
            message: 'Group information updated successfully',
            data: registration
        });
    }
    catch (error) {
        console.error('Update group info error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update group information',
            error: process.env.NODE_ENV === 'development' ? error : undefined
        });
    }
};
exports.updateGroupInfo = updateGroupInfo;
const updateGuardianInfo = async (req, res) => {
    try {
        const { id } = req.params;
        const { nextStep, ...guardianInfo } = req.body;
        const foundRegistration = await findRegistrationByIdOrUserId(id, req.user?.userId);
        if (!foundRegistration) {
            res.status(404).json({
                success: false,
                message: 'Registration not found'
            });
            return;
        }
        const updateObject = {
            $addToSet: { completedSteps: 4 },
            currentStep: nextStep || 4
        };
        Object.keys(guardianInfo).forEach(key => {
            if (guardianInfo[key] !== undefined) {
                updateObject[`guardianInfo.${key}`] = guardianInfo[key];
            }
        });
        const registration = await Registration_1.default.findOneAndUpdate({ _id: foundRegistration._id, userId: req.user?.userId }, updateObject, { new: true });
        if (!registration) {
            res.status(404).json({
                success: false,
                message: 'Registration not found'
            });
            return;
        }
        res.status(200).json({
            success: true,
            message: 'Guardian information updated successfully',
            data: registration
        });
    }
    catch (error) {
        console.error('Update guardian info error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update guardian information',
            error: process.env.NODE_ENV === 'development' ? error : undefined
        });
    }
};
exports.updateGuardianInfo = updateGuardianInfo;
const updateMediaInfo = async (req, res) => {
    try {
        const { id } = req.params;
        const { nextStep } = req.body;
        const files = req.files;
        const foundRegistration = await findRegistrationByIdOrUserId(id, req.user?.userId);
        if (!foundRegistration) {
            res.status(404).json({
                success: false,
                message: 'Registration not found'
            });
            return;
        }
        const mediaInfo = {};
        if (files?.profilePhoto && files.profilePhoto[0]) {
            try {
                const photoFile = files.profilePhoto[0];
                const photoPublicId = `user_${req.user?.userId}_profile_${Date.now()}`;
                const photoResult = await cloudinaryService_1.default.uploadImage(photoFile.buffer, photoPublicId);
                mediaInfo.profilePhoto = {
                    url: photoResult.url,
                    publicId: photoResult.publicId,
                    format: photoResult.format,
                    width: photoResult.width,
                    height: photoResult.height,
                    bytes: photoResult.bytes
                };
            }
            catch (error) {
                console.error('Profile photo upload error:', error);
                res.status(400).json({
                    success: false,
                    message: 'Failed to upload profile photo',
                    error: process.env.NODE_ENV === 'development' ? error : undefined
                });
                return;
            }
        }
        if (files?.videoUpload && files.videoUpload[0]) {
            try {
                const videoFile = files.videoUpload[0];
                if (videoFile.size > 100 * 1024 * 1024) {
                    res.status(400).json({
                        success: false,
                        message: 'Video file is too large. Maximum size is 100MB.',
                        error: process.env.NODE_ENV === 'development' ? `File size: ${Math.round(videoFile.size / 1024 / 1024)}MB` : undefined
                    });
                    return;
                }
                const videoPublicId = `user_${req.user?.userId}_video_${Date.now()}`;
                const videoResult = await cloudinaryService_1.default.uploadVideo(videoFile.buffer, videoPublicId);
                const thumbnailUrl = cloudinaryService_1.default.generateVideoThumbnail(videoResult.publicId);
                mediaInfo.videoUpload = {
                    url: videoResult.url,
                    publicId: videoResult.publicId,
                    format: videoResult.format,
                    width: videoResult.width,
                    height: videoResult.height,
                    duration: videoResult.duration,
                    bytes: videoResult.bytes,
                    thumbnailUrl: thumbnailUrl
                };
            }
            catch (error) {
                console.error('Video upload error:', error);
                let errorMessage = 'Failed to upload video';
                if (error.message.includes('Invalid video data format')) {
                    errorMessage = 'Invalid video format. Please upload a valid video file (MP4, MOV, AVI, etc.)';
                }
                else if (error.message.includes('too large')) {
                    errorMessage = 'Video file is too large. Please use a smaller file (max 100MB)';
                }
                else if (error.message.includes('rate limit')) {
                    errorMessage = 'Upload rate limit exceeded. Please try again in a few minutes';
                }
                else if (error.message.includes('Invalid video format or corrupted file')) {
                    errorMessage = 'The video file appears to be corrupted or in an unsupported format. Please try a different file';
                }
                res.status(400).json({
                    success: false,
                    message: errorMessage,
                    error: process.env.NODE_ENV === 'development' ? error.message : undefined
                });
                return;
            }
        }
        const registration = await Registration_1.default.findOneAndUpdate({ _id: foundRegistration._id, userId: req.user?.userId }, {
            $set: {
                'mediaInfo.profilePhoto': mediaInfo.profilePhoto || foundRegistration.mediaInfo?.profilePhoto,
                'mediaInfo.videoUpload': mediaInfo.videoUpload || foundRegistration.mediaInfo?.videoUpload
            },
            $addToSet: { completedSteps: 5 },
            currentStep: nextStep || 5
        }, { new: true });
        if (!registration) {
            res.status(404).json({
                success: false,
                message: 'Registration not found'
            });
            return;
        }
        res.status(200).json({
            success: true,
            message: 'Media information updated successfully',
            data: registration,
            uploadedFiles: {
                profilePhoto: mediaInfo.profilePhoto ? 'uploaded' : 'not provided',
                videoUpload: mediaInfo.videoUpload ? 'uploaded' : 'not provided'
            }
        });
    }
    catch (error) {
        console.error('Update media info error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update media information',
            error: process.env.NODE_ENV === 'development' ? error : undefined
        });
    }
};
exports.updateMediaInfo = updateMediaInfo;
const updateAuditionInfo = async (req, res) => {
    try {
        const { id } = req.params;
        const { nextStep, ...bodyData } = req.body;
        let auditionInfo = bodyData;
        if (auditionInfo.audtionRequirement && !auditionInfo.auditionRequirement) {
            auditionInfo.auditionRequirement = auditionInfo.audtionRequirement;
            delete auditionInfo.audtionRequirement;
        }
        const schedule = await AuditionSchedule_1.default.findOne({
            location: auditionInfo.auditionLocation,
            date: auditionInfo.auditionDate
        });
        if (schedule) {
            const timeSlot = schedule.timeSlots.find(slot => slot.time === auditionInfo.auditionTime);
            if (timeSlot && timeSlot.bookedContestants >= timeSlot.maxContestants) {
                res.status(400).json({
                    success: false,
                    message: 'Selected audition time slot is fully booked'
                });
                return;
            }
        }
        const foundRegistration = await findRegistrationByIdOrUserId(id, req.user?.userId);
        if (!foundRegistration) {
            res.status(404).json({
                success: false,
                message: 'Registration not found'
            });
            return;
        }
        const updateObject = {
            $addToSet: { completedSteps: 6 },
            currentStep: nextStep || 6
        };
        Object.keys(auditionInfo).forEach(key => {
            if (auditionInfo[key] !== undefined) {
                updateObject[`auditionInfo.${key}`] = auditionInfo[key];
            }
        });
        const registration = await Registration_1.default.findOneAndUpdate({ _id: foundRegistration._id, userId: req.user?.userId }, updateObject, { new: true });
        if (!registration) {
            res.status(404).json({
                success: false,
                message: 'Registration not found'
            });
            return;
        }
        res.status(200).json({
            success: true,
            message: 'Audition information updated successfully',
            data: registration
        });
    }
    catch (error) {
        console.error('Update audition info error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update audition information',
            error: process.env.NODE_ENV === 'development' ? error : undefined
        });
    }
};
exports.updateAuditionInfo = updateAuditionInfo;
const updateTermsConditions = async (req, res) => {
    try {
        const { id } = req.params;
        const { nextStep, ...termsConditions } = req.body;
        const foundRegistration = await findRegistrationByIdOrUserId(id, req.user?.userId);
        if (!foundRegistration) {
            res.status(404).json({
                success: false,
                message: 'Registration not found'
            });
            return;
        }
        const updateObject = {
            $addToSet: { completedSteps: 7 },
            currentStep: nextStep || 7
        };
        Object.keys(termsConditions).forEach(key => {
            if (termsConditions[key] !== undefined) {
                updateObject[`termsConditions.${key}`] = termsConditions[key];
            }
        });
        updateObject['termsConditions.signedAt'] = new Date();
        const registration = await Registration_1.default.findOneAndUpdate({ _id: foundRegistration._id, userId: req.user?.userId }, updateObject, { new: true });
        if (!registration) {
            res.status(404).json({
                success: false,
                message: 'Registration not found'
            });
            return;
        }
        res.status(200).json({
            success: true,
            message: 'Terms and conditions updated successfully',
            data: registration
        });
    }
    catch (error) {
        console.error('Update terms conditions error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update terms and conditions',
            error: process.env.NODE_ENV === 'development' ? error : undefined
        });
    }
};
exports.updateTermsConditions = updateTermsConditions;
const getRegistrationStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const registration = await Registration_1.default.findOne({
            _id: id,
            userId: req.user?.userId
        }).select('status currentStep completedSteps paymentInfo.paymentStatus submittedAt reviewNotes');
        if (!registration) {
            res.status(404).json({
                success: false,
                message: 'Registration not found'
            });
            return;
        }
        res.status(200).json({
            success: true,
            message: 'Registration status retrieved successfully',
            data: registration
        });
    }
    catch (error) {
        console.error('Get registration status error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve registration status',
            error: process.env.NODE_ENV === 'development' ? error : undefined
        });
    }
};
exports.getRegistrationStatus = getRegistrationStatus;
const deleteRegistration = async (req, res) => {
    try {
        const { id } = req.params;
        const registration = await findRegistrationByIdOrUserId(id, req.user?.userId);
        if (!registration) {
            res.status(404).json({
                success: false,
                message: 'Registration not found'
            });
            return;
        }
        if (registration.status !== 'draft') {
            res.status(400).json({
                success: false,
                message: 'Cannot delete a submitted registration'
            });
            return;
        }
        await Registration_1.default.findByIdAndDelete(id);
        res.status(200).json({
            success: true,
            message: 'Registration deleted successfully'
        });
    }
    catch (error) {
        console.error('Delete registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete registration',
            error: process.env.NODE_ENV === 'development' ? error : undefined
        });
    }
};
exports.deleteRegistration = deleteRegistration;
//# sourceMappingURL=registrationController.js.map