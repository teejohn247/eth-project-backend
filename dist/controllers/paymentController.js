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
exports.createTransaction = exports.updatePaymentTransaction = exports.getAllPayments = exports.savePaymentInfo = exports.refundPayment = exports.handlePaymentWebhook = exports.getPaymentStatus = exports.verifyPayment = exports.initializePayment = void 0;
const Registration_1 = __importDefault(require("../models/Registration"));
const PaymentTransaction_1 = __importDefault(require("../models/PaymentTransaction"));
const crypto_1 = __importDefault(require("crypto"));
const initializePayment = async (req, res) => {
    try {
        const { registrationId } = req.params;
        const { amount = 1090, currency = 'NGN' } = req.body;
        const registration = await Registration_1.default.findOne({
            _id: registrationId,
            userId: req.user?.userId
        });
        if (!registration) {
            res.status(404).json({
                success: false,
                message: 'Registration not found'
            });
            return;
        }
        if (registration.paymentInfo.paymentStatus === 'completed') {
            res.status(400).json({
                success: false,
                message: 'Payment has already been completed for this registration'
            });
            return;
        }
        const reference = `ETH_${Date.now()}_${crypto_1.default.randomBytes(8).toString('hex')}`;
        const transaction = new PaymentTransaction_1.default({
            registrationId,
            userId: req.user?.userId,
            reference,
            amount,
            currency,
            status: 'initiated'
        });
        await transaction.save();
        registration.paymentInfo.paymentReference = reference;
        registration.paymentInfo.amount = amount;
        registration.paymentInfo.currency = currency;
        registration.paymentInfo.paymentStatus = 'pending';
        await registration.save();
        const paymentData = {
            reference,
            amount,
            currency,
            email: req.user?.email,
            callback_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/callback`,
            metadata: {
                registrationId,
                userId: req.user?.userId
            }
        };
        const paymentResponse = {
            status: true,
            message: 'Authorization URL created',
            data: {
                authorization_url: `https://checkout.paystack.com/${reference}`,
                access_code: `access_${reference}`,
                reference
            }
        };
        res.status(200).json({
            success: true,
            message: 'Payment initialized successfully',
            data: {
                reference,
                authorization_url: paymentResponse.data.authorization_url,
                access_code: paymentResponse.data.access_code,
                amount,
                currency
            }
        });
    }
    catch (error) {
        console.error('Initialize payment error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to initialize payment',
            error: process.env.NODE_ENV === 'development' ? error : undefined
        });
    }
};
exports.initializePayment = initializePayment;
const verifyPayment = async (req, res) => {
    try {
        const { reference } = req.params;
        const transaction = await PaymentTransaction_1.default.findOne({ reference });
        if (!transaction) {
            res.status(404).json({
                success: false,
                message: 'Transaction not found'
            });
            return;
        }
        const verificationResponse = {
            status: true,
            message: 'Verification successful',
            data: {
                id: crypto_1.default.randomInt(1000000, 9999999),
                domain: 'test',
                status: 'success',
                reference: reference,
                amount: transaction.amount * 100,
                message: null,
                gateway_response: 'Successful',
                paid_at: new Date().toISOString(),
                created_at: transaction.createdAt.toISOString(),
                channel: 'card',
                currency: transaction.currency,
                ip_address: req.ip,
                metadata: {
                    registrationId: transaction.registrationId,
                    userId: transaction.userId
                },
                log: {
                    start_time: Math.floor(Date.now() / 1000),
                    time_spent: 5,
                    attempts: 1,
                    errors: 0,
                    success: true,
                    mobile: false,
                    input: [],
                    history: []
                },
                fees: 15.75,
                fees_split: null,
                authorization: {
                    authorization_code: 'AUTH_' + crypto_1.default.randomBytes(8).toString('hex'),
                    bin: '408408',
                    last4: '4081',
                    exp_month: '12',
                    exp_year: '2030',
                    channel: 'card',
                    card_type: 'visa DEBIT',
                    bank: 'Test Bank',
                    country_code: 'NG',
                    brand: 'visa',
                    reusable: true,
                    signature: 'SIG_' + crypto_1.default.randomBytes(16).toString('hex')
                },
                customer: {
                    id: crypto_1.default.randomInt(1000000, 9999999),
                    first_name: null,
                    last_name: null,
                    email: 'customer@email.com',
                    customer_code: 'CUS_' + crypto_1.default.randomBytes(8).toString('hex'),
                    phone: null,
                    metadata: null,
                    risk_action: 'default',
                    international_format_phone: null
                },
                plan_object: {},
                subaccount: {}
            }
        };
        if (verificationResponse.data.status === 'success') {
            transaction.status = 'successful';
            transaction.gatewayReference = verificationResponse.data.id.toString();
            transaction.gatewayResponse = verificationResponse.data;
            transaction.paymentMethod = verificationResponse.data.channel;
            transaction.processedAt = new Date();
            await transaction.save();
            const registration = await Registration_1.default.findById(transaction.registrationId);
            if (registration) {
                registration.paymentInfo.paymentStatus = 'completed';
                registration.paymentInfo.transactionId = verificationResponse.data.id.toString();
                registration.paymentInfo.paymentMethod = verificationResponse.data.channel;
                registration.paymentInfo.paidAt = new Date();
                registration.paymentInfo.paymentResponse = verificationResponse.data;
                if (!registration.completedSteps.includes(7)) {
                    registration.completedSteps.push(7);
                }
                registration.currentStep = Math.max(7, registration.currentStep);
                await registration.save();
            }
            res.status(200).json({
                success: true,
                message: 'Payment verified successfully',
                data: {
                    reference,
                    status: 'successful',
                    amount: transaction.amount,
                    currency: transaction.currency,
                    paidAt: transaction.processedAt,
                    gatewayResponse: verificationResponse.data
                }
            });
        }
        else {
            transaction.status = 'failed';
            transaction.failureReason = verificationResponse.message || 'Payment verification failed';
            await transaction.save();
            const registration = await Registration_1.default.findById(transaction.registrationId);
            if (registration) {
                registration.paymentInfo.paymentStatus = 'failed';
                await registration.save();
            }
            res.status(400).json({
                success: false,
                message: 'Payment verification failed',
                data: {
                    reference,
                    status: 'failed',
                    reason: transaction.failureReason
                }
            });
        }
    }
    catch (error) {
        console.error('Verify payment error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to verify payment',
            error: process.env.NODE_ENV === 'development' ? error : undefined
        });
    }
};
exports.verifyPayment = verifyPayment;
const getPaymentStatus = async (req, res) => {
    try {
        const { registrationId } = req.params;
        const registration = await Registration_1.default.findOne({
            _id: registrationId,
            userId: req.user?.userId
        }).select('paymentInfo');
        if (!registration) {
            res.status(404).json({
                success: false,
                message: 'Registration not found'
            });
            return;
        }
        const transaction = await PaymentTransaction_1.default.findOne({
            registrationId,
            userId: req.user?.userId
        }).sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            message: 'Payment status retrieved successfully',
            data: {
                paymentStatus: registration.paymentInfo.paymentStatus,
                amount: registration.paymentInfo.amount,
                currency: registration.paymentInfo.currency,
                reference: registration.paymentInfo.paymentReference,
                paidAt: registration.paymentInfo.paidAt,
                transaction: transaction ? {
                    reference: transaction.reference,
                    status: transaction.status,
                    paymentMethod: transaction.paymentMethod,
                    processedAt: transaction.processedAt
                } : null
            }
        });
    }
    catch (error) {
        console.error('Get payment status error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve payment status',
            error: process.env.NODE_ENV === 'development' ? error : undefined
        });
    }
};
exports.getPaymentStatus = getPaymentStatus;
const handlePaymentWebhook = async (req, res) => {
    try {
        const payload = req.body;
        const signature = req.headers['x-paystack-signature'];
        const webhookSecret = process.env.PAYSTACK_WEBHOOK_SECRET || 'your-webhook-secret';
        const hash = crypto_1.default.createHmac('sha512', webhookSecret).update(JSON.stringify(payload)).digest('hex');
        if (hash !== signature) {
            res.status(400).json({
                success: false,
                message: 'Invalid webhook signature'
            });
            return;
        }
        const { event, data } = payload;
        if (event === 'charge.success') {
            const { reference, status, amount, currency } = data;
            const transaction = await PaymentTransaction_1.default.findOne({ reference });
            if (transaction) {
                transaction.status = status === 'success' ? 'successful' : 'failed';
                transaction.gatewayResponse = data;
                transaction.processedAt = new Date();
                await transaction.save();
                const registration = await Registration_1.default.findById(transaction.registrationId);
                if (registration && status === 'success') {
                    registration.paymentInfo.paymentStatus = 'completed';
                    registration.paymentInfo.paidAt = new Date();
                    registration.paymentInfo.paymentResponse = data;
                    if (!registration.completedSteps.includes(7)) {
                        registration.completedSteps.push(7);
                    }
                    registration.currentStep = Math.max(7, registration.currentStep);
                    await registration.save();
                }
            }
        }
        res.status(200).json({
            success: true,
            message: 'Webhook processed successfully'
        });
    }
    catch (error) {
        console.error('Payment webhook error:', error);
        res.status(500).json({
            success: false,
            message: 'Webhook processing failed',
            error: process.env.NODE_ENV === 'development' ? error : undefined
        });
    }
};
exports.handlePaymentWebhook = handlePaymentWebhook;
const refundPayment = async (req, res) => {
    try {
        const { reference } = req.params;
        const { reason } = req.body;
        if (req.user?.role !== 'admin') {
            res.status(403).json({
                success: false,
                message: 'Access denied. Admin role required.'
            });
            return;
        }
        const transaction = await PaymentTransaction_1.default.findOne({ reference });
        if (!transaction) {
            res.status(404).json({
                success: false,
                message: 'Transaction not found'
            });
            return;
        }
        if (transaction.status !== 'successful') {
            res.status(400).json({
                success: false,
                message: 'Only successful transactions can be refunded'
            });
            return;
        }
        const refundResponse = {
            status: true,
            message: 'Refund successful',
            data: {
                transaction: {
                    reference,
                    amount: transaction.amount,
                    currency: transaction.currency,
                    status: 'refunded',
                    refunded_at: new Date().toISOString()
                }
            }
        };
        transaction.status = 'refunded';
        transaction.gatewayResponse = { ...transaction.gatewayResponse, refund: refundResponse.data };
        await transaction.save();
        const registration = await Registration_1.default.findById(transaction.registrationId);
        if (registration) {
            registration.paymentInfo.paymentStatus = 'refunded';
            await registration.save();
        }
        res.status(200).json({
            success: true,
            message: 'Payment refunded successfully',
            data: {
                reference,
                amount: transaction.amount,
                currency: transaction.currency,
                reason,
                refundedAt: new Date()
            }
        });
    }
    catch (error) {
        console.error('Refund payment error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to process refund',
            error: process.env.NODE_ENV === 'development' ? error : undefined
        });
    }
};
exports.refundPayment = refundPayment;
const savePaymentInfo = async (req, res) => {
    try {
        const { registrationId } = req.params;
        const paymentData = req.body;
        const { userId: bodyUserId, ...actualPaymentData } = paymentData;
        if (!actualPaymentData || Object.keys(actualPaymentData).length === 0) {
            res.status(400).json({
                success: false,
                message: 'Payment data is required'
            });
            return;
        }
        let registration;
        if (registrationId && registrationId !== 'undefined' && registrationId !== 'null') {
            registration = await Registration_1.default.findOne({
                _id: registrationId,
                userId: req.user?.userId
            });
        }
        if (!registration) {
            const targetUserId = bodyUserId || req.user?.userId;
            registration = await Registration_1.default.findOne({
                userId: targetUserId
            });
            if (registration && registration.userId.toString() !== req.user?.userId) {
                res.status(403).json({
                    success: false,
                    message: 'Unauthorized to access this registration'
                });
                return;
            }
        }
        if (!registration) {
            res.status(404).json({
                success: false,
                message: 'Registration not found'
            });
            return;
        }
        const { reference, amount, transAmount, currency = 'NGN', status, gateway, transactionId, paymentMethod, email, ...otherData } = actualPaymentData;
        const paymentAmount = transAmount ? parseFloat(transAmount.toString()) : (amount ? parseFloat(amount.toString()) : null);
        const paymentReference = reference || `ETH_${Date.now()}_${crypto_1.default.randomBytes(8).toString('hex')}`;
        let transaction = await PaymentTransaction_1.default.findOne({
            registrationId: registration._id,
            userId: req.user?.userId
        });
        if (!transaction) {
            transaction = new PaymentTransaction_1.default({
                registrationId: registration._id,
                userId: req.user?.userId,
                reference: paymentReference,
                amount: paymentAmount || 0,
                currency: currency,
                status: status || 'pending'
            });
        }
        if (paymentAmount)
            transaction.amount = paymentAmount;
        if (currency)
            transaction.currency = currency;
        if (paymentMethod)
            transaction.paymentMethod = paymentMethod;
        if (transactionId)
            transaction.gatewayReference = transactionId;
        if (status) {
            let mappedStatus = 'pending';
            if (status === 'successful' || status === 'success' || status === 'completed' ||
                status === '0' || status === 0 || status === 'SUCCESSFUL' ||
                status === 'SUCCESS' || status === 'COMPLETED') {
                mappedStatus = 'successful';
                transaction.processedAt = new Date();
            }
            else if (status === 'failed' || status === 'failure' || status === 'error' ||
                status === '1' || status === 1 || status === 'FAILED' ||
                status === 'FAILURE' || status === 'ERROR') {
                mappedStatus = 'failed';
            }
            else if (status === 'pending' || status === 'processing' || status === 'initiated' ||
                status === 'PENDING' || status === 'PROCESSING' || status === 'INITIATED') {
                mappedStatus = 'pending';
            }
            else if (status === 'cancelled' || status === 'canceled' || status === 'CANCELLED' ||
                status === 'CANCELED') {
                mappedStatus = 'cancelled';
            }
            transaction.status = mappedStatus;
        }
        transaction.gatewayResponse = {
            ...transaction.gatewayResponse,
            frontendData: actualPaymentData,
            updatedAt: new Date()
        };
        await transaction.save();
        let registrationPaymentStatus = 'pending';
        if (status === 'successful' || status === 'success' || status === 'completed' ||
            status === '0' || status === 0 || status === 'SUCCESSFUL' ||
            status === 'SUCCESS' || status === 'COMPLETED') {
            registrationPaymentStatus = 'completed';
        }
        else if (status === 'failed' || status === 'failure' || status === 'error' ||
            status === '1' || status === 1 || status === 'FAILED' ||
            status === 'FAILURE' || status === 'ERROR') {
            registrationPaymentStatus = 'failed';
        }
        registration.paymentInfo = {
            ...registration.paymentInfo,
            paymentReference: paymentReference,
            amount: paymentAmount || registration.paymentInfo.amount,
            currency: currency,
            paymentStatus: registrationPaymentStatus,
            transactionId: transactionId || transaction.gatewayReference,
            paymentMethod: paymentMethod,
            paymentResponse: actualPaymentData,
            paidAt: registrationPaymentStatus === 'completed' ? new Date() : registration.paymentInfo.paidAt
        };
        if (registration.registrationType === 'bulk' && registration.bulkRegistrationId) {
            try {
                const { BulkRegistration } = await Promise.resolve().then(() => __importStar(require('../models')));
                const bulkRegistration = await BulkRegistration.findById(registration.bulkRegistrationId);
                if (bulkRegistration) {
                    bulkRegistration.paymentInfo = {
                        paymentStatus: registrationPaymentStatus === 'completed' ? 'completed' :
                            registrationPaymentStatus === 'failed' ? 'failed' : 'pending',
                        paymentReference: paymentReference,
                        transactionId: transactionId || transaction.gatewayReference,
                        paymentMethod: paymentMethod,
                        paidAt: registrationPaymentStatus === 'completed' ? new Date() : undefined,
                        paymentResponse: actualPaymentData
                    };
                    if (registrationPaymentStatus === 'completed') {
                        bulkRegistration.status = 'active';
                        try {
                            const { User } = await Promise.resolve().then(() => __importStar(require('../models')));
                            await User.findByIdAndUpdate(bulkRegistration.ownerId, { role: 'sponsor' });
                            console.log(`✅ Updated user ${bulkRegistration.ownerId} role to sponsor after bulk payment`);
                        }
                        catch (error) {
                            console.error('Failed to update user role to sponsor:', error);
                        }
                    }
                    else if (registrationPaymentStatus === 'failed') {
                        bulkRegistration.status = 'payment_pending';
                    }
                    await bulkRegistration.save();
                }
            }
            catch (error) {
                console.error('Failed to update bulk registration payment:', error);
            }
        }
        if (registration.paymentInfo.paymentStatus === 'completed') {
            const paymentStep = 8;
            if (!registration.completedSteps.includes(paymentStep)) {
                registration.completedSteps.push(paymentStep);
                registration.currentStep = Math.max(registration.currentStep, paymentStep);
            }
            if (registration.registrationType !== 'bulk' && registration.status === 'draft') {
                registration.status = 'submitted';
                registration.submittedAt = new Date();
            }
        }
        await registration.save();
        const responseData = {
            registrationId: registration._id,
            paymentReference: paymentReference,
            paymentStatus: registration.paymentInfo.paymentStatus,
            amount: registration.paymentInfo.amount,
            currency: registration.paymentInfo.currency,
            transactionId: transaction.gatewayReference,
            currentStep: registration.currentStep,
            completedSteps: registration.completedSteps,
            registrationStatus: registration.status,
            savedData: paymentData
        };
        if (registration.registrationType === 'bulk' && registration.bulkRegistrationId) {
            try {
                const { BulkRegistration } = await Promise.resolve().then(() => __importStar(require('../models')));
                const bulkRegistration = await BulkRegistration.findById(registration.bulkRegistrationId);
                if (bulkRegistration) {
                    responseData.bulkRegistration = {
                        bulkRegistrationId: bulkRegistration._id,
                        bulkRegistrationNumber: bulkRegistration.bulkRegistrationNumber,
                        totalSlots: bulkRegistration.totalSlots,
                        usedSlots: bulkRegistration.usedSlots,
                        availableSlots: bulkRegistration.availableSlots,
                        status: bulkRegistration.status,
                        canAddParticipants: bulkRegistration.status === 'active',
                        nextStep: bulkRegistration.status === 'active' ? 'add_participants' : 'payment',
                        addParticipantEndpoint: bulkRegistration.status === 'active' ?
                            `/api/v1/registrations/${registration._id}/participants` : undefined
                    };
                }
            }
            catch (error) {
                console.error('Failed to fetch bulk registration info for response:', error);
            }
        }
        const message = registration.registrationType === 'bulk' && registration.paymentInfo.paymentStatus === 'completed'
            ? 'Bulk payment processed successfully. You can now add participants.'
            : 'Payment information saved successfully';
        res.status(200).json({
            success: true,
            message: message,
            data: responseData
        });
    }
    catch (error) {
        console.error('Save payment info error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to save payment information',
            error: process.env.NODE_ENV === 'development' ? error : undefined
        });
    }
};
exports.savePaymentInfo = savePaymentInfo;
const getAllPayments = async (req, res) => {
    try {
        const { page = 1, limit = 10, status, paymentMethod, currency, userId, registrationId, startDate, endDate, amountMin, amountMax, search } = req.query;
        const filter = {
            userId: req.user?.userId
        };
        if (status) {
            filter.status = status;
        }
        if (paymentMethod) {
            filter.paymentMethod = paymentMethod;
        }
        if (currency) {
            filter.currency = currency;
        }
        if (registrationId) {
            filter.registrationId = registrationId;
        }
        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) {
                filter.createdAt.$gte = new Date(startDate);
            }
            if (endDate) {
                filter.createdAt.$lte = new Date(endDate);
            }
        }
        if (amountMin || amountMax) {
            filter.amount = {};
            if (amountMin) {
                filter.amount.$gte = parseFloat(amountMin);
            }
            if (amountMax) {
                filter.amount.$lte = parseFloat(amountMax);
            }
        }
        if (search) {
            filter.$or = [
                { reference: { $regex: search, $options: 'i' } },
                { gatewayReference: { $regex: search, $options: 'i' } }
            ];
        }
        const pageNumber = parseInt(page, 10);
        const limitNumber = parseInt(limit, 10);
        const skip = (pageNumber - 1) * limitNumber;
        const totalCount = await PaymentTransaction_1.default.countDocuments(filter);
        const payments = await PaymentTransaction_1.default.find(filter)
            .populate('userId', 'firstName lastName email')
            .populate('registrationId', 'registrationNumber registrationType status')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNumber)
            .lean();
        const totalPages = Math.ceil(totalCount / limitNumber);
        const hasNextPage = pageNumber < totalPages;
        const hasPrevPage = pageNumber > 1;
        res.status(200).json({
            success: true,
            message: 'Payment transactions retrieved successfully',
            data: {
                payments,
                pagination: {
                    currentPage: pageNumber,
                    totalPages,
                    totalCount,
                    limit: limitNumber,
                    hasNextPage,
                    hasPrevPage
                },
                filters: {
                    status,
                    paymentMethod,
                    currency,
                    registrationId,
                    startDate,
                    endDate,
                    amountMin,
                    amountMax,
                    search
                }
            }
        });
    }
    catch (error) {
        console.error('Get all payments error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve payment transactions',
            error: process.env.NODE_ENV === 'development' ? error : undefined
        });
    }
};
exports.getAllPayments = getAllPayments;
const updatePaymentTransaction = async (req, res) => {
    try {
        const { reference } = req.params;
        const updateData = req.body;
        if (req.user?.role !== 'admin') {
            res.status(403).json({
                success: false,
                message: 'Access denied. Admin role required.'
            });
            return;
        }
        if (!updateData || Object.keys(updateData).length === 0) {
            res.status(400).json({
                success: false,
                message: 'Update data is required'
            });
            return;
        }
        let transaction;
        const isObjectId = /^[0-9a-fA-F]{24}$/.test(reference);
        if (isObjectId) {
            transaction = await PaymentTransaction_1.default.findById(reference);
        }
        else {
            transaction = await PaymentTransaction_1.default.findOne({ reference: reference });
        }
        if (!transaction) {
            res.status(404).json({
                success: false,
                message: 'Transaction not found'
            });
            return;
        }
        const { status, amount, currency, paymentMethod, gatewayReference, failureReason, gatewayResponse, notes, ...otherData } = updateData;
        const changes = {};
        const oldValues = {};
        if (status && ['initiated', 'pending', 'successful', 'failed', 'cancelled', 'refunded'].includes(status)) {
            if (transaction.status !== status) {
                oldValues.status = transaction.status;
                changes.status = status;
                transaction.status = status;
                if (status === 'successful' && !transaction.processedAt) {
                    transaction.processedAt = new Date();
                    changes.processedAt = transaction.processedAt;
                }
            }
        }
        if (amount !== undefined) {
            const newAmount = parseFloat(amount.toString());
            if (!isNaN(newAmount) && transaction.amount !== newAmount) {
                oldValues.amount = transaction.amount;
                changes.amount = newAmount;
                transaction.amount = newAmount;
            }
        }
        if (currency && transaction.currency !== currency) {
            oldValues.currency = transaction.currency;
            changes.currency = currency;
            transaction.currency = currency;
        }
        if (paymentMethod && transaction.paymentMethod !== paymentMethod) {
            oldValues.paymentMethod = transaction.paymentMethod;
            changes.paymentMethod = paymentMethod;
            transaction.paymentMethod = paymentMethod;
        }
        if (gatewayReference && transaction.gatewayReference !== gatewayReference) {
            oldValues.gatewayReference = transaction.gatewayReference;
            changes.gatewayReference = gatewayReference;
            transaction.gatewayReference = gatewayReference;
        }
        if (failureReason !== undefined) {
            if (transaction.failureReason !== failureReason) {
                oldValues.failureReason = transaction.failureReason;
                changes.failureReason = failureReason;
                transaction.failureReason = failureReason;
            }
        }
        if (gatewayResponse) {
            const updatedGatewayResponse = {
                ...transaction.gatewayResponse,
                ...gatewayResponse,
                adminUpdate: {
                    updatedAt: new Date(),
                    updatedBy: req.user?.userId,
                    changes: changes
                }
            };
            transaction.gatewayResponse = updatedGatewayResponse;
            changes.gatewayResponse = 'updated';
        }
        if (notes) {
            const adminNotes = {
                note: notes,
                addedBy: req.user?.userId,
                addedAt: new Date()
            };
            if (!transaction.gatewayResponse) {
                transaction.gatewayResponse = {};
            }
            if (!transaction.gatewayResponse.adminNotes) {
                transaction.gatewayResponse.adminNotes = [];
            }
            transaction.gatewayResponse.adminNotes.push(adminNotes);
            changes.adminNotes = 'added';
        }
        transaction.updatedAt = new Date();
        await transaction.save();
        if (changes.status) {
            const registration = await Registration_1.default.findById(transaction.registrationId);
            if (registration) {
                let registrationPaymentStatus = registration.paymentInfo.paymentStatus;
                if (changes.status === 'successful') {
                    registrationPaymentStatus = 'completed';
                    registration.paymentInfo.paidAt = new Date();
                    const paymentStep = 8;
                    if (!registration.completedSteps.includes(paymentStep)) {
                        registration.completedSteps.push(paymentStep);
                        registration.currentStep = Math.max(registration.currentStep, paymentStep);
                    }
                    if (registration.registrationType !== 'bulk' && registration.status === 'draft') {
                        registration.status = 'submitted';
                        registration.submittedAt = new Date();
                    }
                }
                else if (changes.status === 'failed') {
                    registrationPaymentStatus = 'failed';
                }
                else if (changes.status === 'refunded') {
                    registrationPaymentStatus = 'refunded';
                }
                registration.paymentInfo.paymentStatus = registrationPaymentStatus;
                if (changes.amount)
                    registration.paymentInfo.amount = changes.amount;
                if (changes.currency)
                    registration.paymentInfo.currency = changes.currency;
                if (changes.paymentMethod)
                    registration.paymentInfo.paymentMethod = changes.paymentMethod;
                if (changes.gatewayReference)
                    registration.paymentInfo.transactionId = changes.gatewayReference;
                await registration.save();
                if (registration.registrationType === 'bulk' && registration.bulkRegistrationId) {
                    try {
                        const { BulkRegistration } = await Promise.resolve().then(() => __importStar(require('../models')));
                        const bulkRegistration = await BulkRegistration.findById(registration.bulkRegistrationId);
                        if (bulkRegistration) {
                            bulkRegistration.paymentInfo.paymentStatus = registrationPaymentStatus;
                            if (changes.currency)
                                bulkRegistration.currency = changes.currency;
                            if (changes.paymentMethod)
                                bulkRegistration.paymentInfo.paymentMethod = changes.paymentMethod;
                            if (changes.gatewayReference)
                                bulkRegistration.paymentInfo.transactionId = changes.gatewayReference;
                            if (changes.amount) {
                                bulkRegistration.totalAmount = changes.amount;
                                if (bulkRegistration.totalSlots > 0) {
                                    bulkRegistration.pricePerSlot = changes.amount / bulkRegistration.totalSlots;
                                }
                            }
                            if (registrationPaymentStatus === 'completed') {
                                bulkRegistration.status = 'active';
                                bulkRegistration.paymentInfo.paidAt = new Date();
                                try {
                                    const { User } = await Promise.resolve().then(() => __importStar(require('../models')));
                                    await User.findByIdAndUpdate(bulkRegistration.ownerId, { role: 'sponsor' });
                                    console.log(`✅ Updated user ${bulkRegistration.ownerId} role to sponsor after payment update`);
                                }
                                catch (error) {
                                    console.error('Failed to update user role to sponsor:', error);
                                }
                            }
                            else if (registrationPaymentStatus === 'failed') {
                                bulkRegistration.status = 'payment_pending';
                            }
                            await bulkRegistration.save();
                        }
                    }
                    catch (error) {
                        console.error('Failed to update bulk registration:', error);
                    }
                }
            }
        }
        const responseData = {
            transactionId: transaction._id,
            reference: transaction.reference,
            status: transaction.status,
            amount: transaction.amount,
            currency: transaction.currency,
            paymentMethod: transaction.paymentMethod,
            gatewayReference: transaction.gatewayReference,
            processedAt: transaction.processedAt,
            updatedAt: transaction.updatedAt,
            changes: changes,
            oldValues: oldValues
        };
        res.status(200).json({
            success: true,
            message: 'Payment transaction updated successfully',
            data: responseData
        });
    }
    catch (error) {
        console.error('Update payment transaction error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update payment transaction',
            error: process.env.NODE_ENV === 'development' ? error : undefined
        });
    }
};
exports.updatePaymentTransaction = updatePaymentTransaction;
const createTransaction = async (req, res) => {
    try {
        const { registrationId } = req.params;
        const transactionData = req.body;
        if (!transactionData || Object.keys(transactionData).length === 0) {
            res.status(400).json({
                success: false,
                message: 'Transaction data is required'
            });
            return;
        }
        if (req.user?.role !== 'admin') {
            res.status(403).json({
                success: false,
                message: 'Access denied. Admin role required.'
            });
            return;
        }
        console.log(`🔍 Admin looking for registration ${registrationId}`);
        const registration = await Registration_1.default.findById(registrationId);
        if (!registration) {
            console.log(`❌ Registration not found: ${registrationId}`);
            res.status(404).json({
                success: false,
                message: 'Registration not found'
            });
            return;
        }
        console.log(`✅ Registration found: ${registration._id} (User: ${registration.userId})`);
        const { reference, amount, transAmount, currency = 'NGN', status = 'pending', paymentMethod, gateway, transactionId, gatewayReference, email, ...otherData } = transactionData;
        const transactionAmount = transAmount ? parseFloat(transAmount.toString()) :
            (amount ? parseFloat(amount.toString()) : 1090);
        const transactionReference = reference || `ETH_${Date.now()}_${crypto_1.default.randomBytes(8).toString('hex')}`;
        const existingTransaction = await PaymentTransaction_1.default.findOne({
            reference: transactionReference
        });
        if (existingTransaction) {
            res.status(409).json({
                success: false,
                message: 'Transaction with this reference already exists',
                data: {
                    existingReference: transactionReference,
                    existingStatus: existingTransaction.status
                }
            });
            return;
        }
        let mappedStatus = 'pending';
        if (status === 'successful' || status === 'success' || status === 'completed' ||
            status === '0' || status === 0 || status === 'SUCCESSFUL' ||
            status === 'SUCCESS' || status === 'COMPLETED') {
            mappedStatus = 'successful';
        }
        else if (status === 'failed' || status === 'failure' || status === 'error' ||
            status === '1' || status === 1 || status === 'FAILED' ||
            status === 'FAILURE' || status === 'ERROR') {
            mappedStatus = 'failed';
        }
        else if (status === 'initiated' || status === 'INITIATED') {
            mappedStatus = 'initiated';
        }
        else if (status === 'cancelled' || status === 'canceled' || status === 'CANCELLED' ||
            status === 'CANCELED') {
            mappedStatus = 'cancelled';
        }
        const transaction = new PaymentTransaction_1.default({
            registrationId: registration._id,
            userId: registration.userId,
            reference: transactionReference,
            amount: transactionAmount,
            currency: currency,
            status: mappedStatus,
            paymentMethod: paymentMethod,
            gatewayReference: transactionId || gatewayReference,
            gatewayResponse: {
                frontendData: transactionData,
                createdAt: new Date(),
                createdByAdmin: req.user?.userId
            }
        });
        if (mappedStatus === 'successful') {
            transaction.processedAt = new Date();
        }
        await transaction.save();
        const registrationPaymentStatus = mappedStatus === 'successful' ? 'completed' :
            mappedStatus === 'failed' ? 'failed' : 'pending';
        registration.paymentInfo = {
            ...registration.paymentInfo,
            paymentReference: transactionReference,
            amount: transactionAmount,
            currency: currency,
            paymentStatus: registrationPaymentStatus,
            transactionId: transaction.gatewayReference,
            paymentMethod: paymentMethod,
            paymentResponse: transactionData,
            paidAt: mappedStatus === 'successful' ? new Date() : registration.paymentInfo.paidAt
        };
        if (mappedStatus === 'successful') {
            const paymentStep = 8;
            if (!registration.completedSteps.includes(paymentStep)) {
                registration.completedSteps.push(paymentStep);
                registration.currentStep = Math.max(registration.currentStep, paymentStep);
            }
            if (registration.registrationType !== 'bulk' && registration.status === 'draft') {
                registration.status = 'submitted';
                registration.submittedAt = new Date();
            }
        }
        if (registration.registrationType === 'bulk' && registration.bulkRegistrationId) {
            try {
                const { BulkRegistration } = await Promise.resolve().then(() => __importStar(require('../models')));
                const bulkRegistration = await BulkRegistration.findById(registration.bulkRegistrationId);
                if (bulkRegistration) {
                    bulkRegistration.paymentInfo = {
                        paymentStatus: registrationPaymentStatus === 'completed' ? 'completed' :
                            registrationPaymentStatus === 'failed' ? 'failed' : 'pending',
                        paymentReference: transactionReference,
                        transactionId: transaction.gatewayReference,
                        paymentMethod: paymentMethod,
                        paidAt: mappedStatus === 'successful' ? new Date() : undefined,
                        paymentResponse: transactionData
                    };
                    if (mappedStatus === 'successful') {
                        bulkRegistration.status = 'active';
                        try {
                            const { User } = await Promise.resolve().then(() => __importStar(require('../models')));
                            await User.findByIdAndUpdate(bulkRegistration.ownerId, { role: 'sponsor' });
                            console.log(`✅ Updated user ${bulkRegistration.ownerId} role to sponsor after transaction creation`);
                        }
                        catch (error) {
                            console.error('Failed to update user role to sponsor:', error);
                        }
                    }
                    else if (mappedStatus === 'failed') {
                        bulkRegistration.status = 'payment_pending';
                    }
                    await bulkRegistration.save();
                }
            }
            catch (error) {
                console.error('Failed to update bulk registration:', error);
            }
        }
        await registration.save();
        const responseData = {
            transactionId: transaction._id,
            reference: transactionReference,
            status: mappedStatus,
            amount: transactionAmount,
            currency: currency,
            paymentMethod: paymentMethod,
            gatewayReference: transaction.gatewayReference,
            registrationId: registration._id,
            registrationStatus: registration.status,
            currentStep: registration.currentStep,
            completedSteps: registration.completedSteps,
            paymentStatus: registration.paymentInfo.paymentStatus,
            createdAt: transaction.createdAt,
            processedAt: transaction.processedAt
        };
        if (registration.registrationType === 'bulk' && registration.bulkRegistrationId) {
            try {
                const { BulkRegistration } = await Promise.resolve().then(() => __importStar(require('../models')));
                const bulkRegistration = await BulkRegistration.findById(registration.bulkRegistrationId);
                if (bulkRegistration) {
                    responseData.bulkRegistration = {
                        bulkRegistrationId: bulkRegistration._id,
                        bulkRegistrationNumber: bulkRegistration.bulkRegistrationNumber,
                        totalSlots: bulkRegistration.totalSlots,
                        usedSlots: bulkRegistration.usedSlots,
                        availableSlots: bulkRegistration.availableSlots,
                        status: bulkRegistration.status,
                        canAddParticipants: bulkRegistration.status === 'active' && mappedStatus === 'successful',
                        nextStep: bulkRegistration.status === 'active' ? 'add_participants' : 'payment'
                    };
                }
            }
            catch (error) {
                console.error('Failed to fetch bulk registration info for response:', error);
            }
        }
        const message = registration.registrationType === 'bulk' && mappedStatus === 'successful'
            ? 'Transaction created successfully. You can now add participants to your bulk registration.'
            : mappedStatus === 'successful'
                ? 'Transaction created successfully. Payment completed.'
                : 'Transaction created successfully.';
        res.status(201).json({
            success: true,
            message: message,
            data: responseData
        });
    }
    catch (error) {
        console.error('Create transaction error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create transaction',
            error: process.env.NODE_ENV === 'development' ? error : undefined
        });
    }
};
exports.createTransaction = createTransaction;
//# sourceMappingURL=paymentController.js.map