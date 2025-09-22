"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listBulkRegistrations = exports.getBulkRegistration = exports.addParticipant = exports.processBulkPayment = exports.createBulkRegistration = void 0;
const models_1 = require("../models");
const emailService_1 = __importDefault(require("../services/emailService"));
const createBulkRegistration = async (req, res) => {
    try {
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
        const pricePerSlot = 10000;
        const totalAmount = totalSlots * pricePerSlot;
        const bulkRegistration = new models_1.BulkRegistration({
            ownerId: userId,
            totalSlots,
            pricePerSlot,
            totalAmount,
            currency: 'NGN',
            status: 'payment_pending',
            participants: []
        });
        await bulkRegistration.save();
        res.status(201).json({
            success: true,
            message: 'Bulk registration created successfully. Proceed to payment.',
            data: {
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
                }
            }
        });
    }
    catch (error) {
        console.error('Create bulk registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create bulk registration',
            error: process.env.NODE_ENV === 'development' ? error : undefined
        });
    }
};
exports.createBulkRegistration = createBulkRegistration;
const processBulkPayment = async (req, res) => {
    try {
        const { bulkRegistrationId } = req.params;
        const userId = req.user?.userId;
        const paymentData = req.body;
        if (!userId) {
            res.status(401).json({ success: false, message: 'Unauthorized: User ID not found in token' });
            return;
        }
        const bulkRegistration = await models_1.BulkRegistration.findOne({
            _id: bulkRegistrationId,
            ownerId: userId
        });
        if (!bulkRegistration) {
            res.status(404).json({ success: false, message: 'Bulk registration not found' });
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
        }
        else if (mappedStatus === 'failed') {
            bulkRegistration.status = 'payment_pending';
        }
        await bulkRegistration.save();
        res.status(200).json({
            success: true,
            message: mappedStatus === 'completed'
                ? 'Bulk payment processed successfully. You can now add participants.'
                : 'Payment status updated.',
            data: {
                bulkRegistrationId: bulkRegistration._id,
                bulkRegistrationNumber: bulkRegistration.bulkRegistrationNumber,
                paymentStatus: bulkRegistration.paymentInfo.paymentStatus,
                status: bulkRegistration.status,
                totalSlots: bulkRegistration.totalSlots,
                availableSlots: bulkRegistration.availableSlots,
                canAddParticipants: bulkRegistration.status === 'active'
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
const addParticipant = async (req, res) => {
    try {
        const { bulkRegistrationId } = req.params;
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
        const bulkRegistration = await models_1.BulkRegistration.findOne({
            _id: bulkRegistrationId,
            ownerId: userId,
            status: 'active'
        });
        if (!bulkRegistration) {
            res.status(404).json({
                success: false,
                message: 'Active bulk registration not found or payment not completed'
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
        const existingUser = await models_1.User.findOne({ email });
        if (existingUser) {
            res.status(400).json({
                success: false,
                message: 'Email already registered in the system'
            });
            return;
        }
        const otpDoc = await models_1.OTP.createOTP(email, 'email_verification', 10);
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
            await emailService_1.default.sendBulkParticipantInvitation(email, otpDoc.otp, firstName, bulkRegistration.bulkRegistrationNumber);
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
                bulkRegistrationId: bulkRegistration._id,
                participantEmail: email,
                participantName: `${firstName} ${lastName}`,
                availableSlots: bulkRegistration.availableSlots,
                usedSlots: bulkRegistration.usedSlots,
                totalSlots: bulkRegistration.totalSlots
            }
        });
    }
    catch (error) {
        console.error('Add participant error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add participant',
            error: process.env.NODE_ENV === 'development' ? error : undefined
        });
    }
};
exports.addParticipant = addParticipant;
const getBulkRegistration = async (req, res) => {
    try {
        const { bulkRegistrationId } = req.params;
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ success: false, message: 'Unauthorized: User ID not found in token' });
            return;
        }
        const bulkRegistration = await models_1.BulkRegistration.findOne({
            _id: bulkRegistrationId,
            ownerId: userId
        }).populate('participants.participantId', 'firstName lastName email')
            .populate('participants.registrationId', 'registrationNumber status');
        if (!bulkRegistration) {
            res.status(404).json({ success: false, message: 'Bulk registration not found' });
            return;
        }
        res.status(200).json({
            success: true,
            message: 'Bulk registration retrieved successfully',
            data: bulkRegistration
        });
    }
    catch (error) {
        console.error('Get bulk registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve bulk registration',
            error: process.env.NODE_ENV === 'development' ? error : undefined
        });
    }
};
exports.getBulkRegistration = getBulkRegistration;
const listBulkRegistrations = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ success: false, message: 'Unauthorized: User ID not found in token' });
            return;
        }
        const bulkRegistrations = await models_1.BulkRegistration.find({
            ownerId: userId
        }).sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            message: 'Bulk registrations retrieved successfully',
            data: bulkRegistrations.map(bulk => ({
                bulkRegistrationId: bulk._id,
                bulkRegistrationNumber: bulk.bulkRegistrationNumber,
                totalSlots: bulk.totalSlots,
                usedSlots: bulk.usedSlots,
                availableSlots: bulk.availableSlots,
                totalAmount: bulk.totalAmount,
                status: bulk.status,
                paymentStatus: bulk.paymentInfo.paymentStatus,
                participantCount: bulk.participants.length,
                createdAt: bulk.createdAt
            }))
        });
    }
    catch (error) {
        console.error('List bulk registrations error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve bulk registrations',
            error: process.env.NODE_ENV === 'development' ? error : undefined
        });
    }
};
exports.listBulkRegistrations = listBulkRegistrations;
//# sourceMappingURL=bulkRegistrationController.js.map