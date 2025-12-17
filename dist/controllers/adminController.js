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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboardStats = exports.getAllUsers = exports.getAllTransactions = exports.getAllRegistrations = void 0;
const models_1 = require("../models");
const getAllRegistrations = async (req, res) => {
    try {
        const { page = 1, limit = 20, status, registrationType, registrationNumber, startDate, endDate, search, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
        const pageNumber = parseInt(page);
        const limitNumber = parseInt(limit);
        const skip = (pageNumber - 1) * limitNumber;
        const filter = {};
        if (status) {
            filter.status = status;
        }
        if (registrationType) {
            filter.registrationType = registrationType;
        }
        if (registrationNumber) {
            filter.registrationNumber = { $regex: registrationNumber, $options: 'i' };
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
        if (search) {
            filter.$or = [
                { registrationNumber: { $regex: search, $options: 'i' } },
                { 'personalInfo.firstName': { $regex: search, $options: 'i' } },
                { 'personalInfo.lastName': { $regex: search, $options: 'i' } },
                { 'personalInfo.email': { $regex: search, $options: 'i' } }
            ];
        }
        const sort = {};
        sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
        const registrations = await models_1.Registration.find(filter)
            .populate('userId', 'firstName lastName email role createdAt')
            .populate('paidBy', 'firstName lastName email role')
            .sort(sort)
            .skip(skip)
            .limit(limitNumber)
            .lean();
        const totalCount = await models_1.Registration.countDocuments(filter);
        const totalPages = Math.ceil(totalCount / limitNumber);
        const enhancedRegistrations = await Promise.all(registrations.map(async (registration) => {
            if (registration.paidBy) {
                registration.sponsor = registration.paidBy;
                delete registration.paidBy;
            }
            if ((registration.registrationType === 'bulk' && registration.bulkRegistrationId) ||
                (registration.isBulkParticipant && registration.bulkRegistrationId)) {
                try {
                    const { BulkRegistration } = await Promise.resolve().then(() => __importStar(require('../models')));
                    const bulkRegistration = await BulkRegistration.findById(registration.bulkRegistrationId);
                    if (bulkRegistration) {
                        registration.bulkRegistration = {
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
                    console.error('Failed to fetch bulk registration info for admin registrations:', error);
                }
            }
            return registration;
        }));
        res.status(200).json({
            success: true,
            message: 'All registrations retrieved successfully',
            data: {
                registrations: enhancedRegistrations,
                pagination: {
                    currentPage: pageNumber,
                    totalPages,
                    totalCount,
                    limit: limitNumber,
                    hasNextPage: pageNumber < totalPages,
                    hasPrevPage: pageNumber > 1
                },
                filters: {
                    status,
                    registrationType,
                    registrationNumber,
                    startDate,
                    endDate,
                    search,
                    sortBy,
                    sortOrder
                }
            }
        });
    }
    catch (error) {
        console.error('Get all registrations error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve registrations',
            error: process.env.NODE_ENV === 'development' ? error : undefined
        });
    }
};
exports.getAllRegistrations = getAllRegistrations;
const getAllTransactions = async (req, res) => {
    try {
        const { page = 1, limit = 20, status, paymentMethod, currency, userId, registrationId, startDate, endDate, amountMin, amountMax, search, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
        const pageNumber = parseInt(page);
        const limitNumber = parseInt(limit);
        const skip = (pageNumber - 1) * limitNumber;
        const Vote = (await Promise.resolve().then(() => __importStar(require('../models/Vote')))).default;
        const voteReferences = (await Vote.distinct('paymentReference')).filter((ref) => ref != null);
        const filter = {
            registrationId: { $ne: null, $exists: true },
            reference: { $nin: voteReferences }
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
        if (userId) {
            filter.userId = userId;
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
        const sort = {};
        sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
        const transactions = await models_1.PaymentTransaction.find(filter)
            .populate('userId', 'firstName lastName email')
            .populate('registrationId', 'registrationNumber registrationType status')
            .sort(sort)
            .skip(skip)
            .limit(limitNumber)
            .lean();
        const totalCount = await models_1.PaymentTransaction.countDocuments(filter);
        const totalPages = Math.ceil(totalCount / limitNumber);
        const summaryPipeline = [
            {
                $match: {
                    ...filter,
                    reference: { $nin: voteReferences }
                }
            },
            {
                $group: {
                    _id: null,
                    totalAmount: { $sum: '$amount' },
                    successfulTransactions: {
                        $sum: { $cond: [{ $eq: ['$status', 'successful'] }, 1, 0] }
                    },
                    failedTransactions: {
                        $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
                    },
                    pendingTransactions: {
                        $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
                    }
                }
            }
        ];
        const summaryResult = await models_1.PaymentTransaction.aggregate(summaryPipeline);
        const summary = summaryResult[0] || {
            totalAmount: 0,
            successfulTransactions: 0,
            failedTransactions: 0,
            pendingTransactions: 0
        };
        res.status(200).json({
            success: true,
            message: 'All payment transactions retrieved successfully',
            data: {
                transactions,
                pagination: {
                    currentPage: pageNumber,
                    totalPages,
                    totalCount,
                    limit: limitNumber,
                    hasNextPage: pageNumber < totalPages,
                    hasPrevPage: pageNumber > 1
                },
                summary,
                filters: {
                    status,
                    paymentMethod,
                    currency,
                    userId,
                    registrationId,
                    startDate,
                    endDate,
                    amountMin,
                    amountMax,
                    search,
                    sortBy,
                    sortOrder
                }
            }
        });
    }
    catch (error) {
        console.error('Get all transactions error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve payment transactions',
            error: process.env.NODE_ENV === 'development' ? error : undefined
        });
    }
};
exports.getAllTransactions = getAllTransactions;
const getAllUsers = async (req, res) => {
    try {
        const { page = 1, limit = 20, role, isActive, isEmailVerified, startDate, endDate, search, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
        const pageNumber = parseInt(page);
        const limitNumber = parseInt(limit);
        const skip = (pageNumber - 1) * limitNumber;
        const filter = {};
        if (role) {
            filter.role = role;
        }
        if (isActive !== undefined) {
            filter.isActive = isActive === 'true';
        }
        if (isEmailVerified !== undefined) {
            filter.isEmailVerified = isEmailVerified === 'true';
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
        if (search) {
            filter.$or = [
                { firstName: { $regex: search, $options: 'i' } },
                { lastName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }
        const sort = {};
        sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
        const users = await models_1.User.find(filter)
            .select('-password')
            .sort(sort)
            .skip(skip)
            .limit(limitNumber)
            .lean();
        const totalCount = await models_1.User.countDocuments(filter);
        const totalPages = Math.ceil(totalCount / limitNumber);
        res.status(200).json({
            success: true,
            message: 'All users retrieved successfully',
            data: {
                users,
                pagination: {
                    currentPage: pageNumber,
                    totalPages,
                    totalCount,
                    limit: limitNumber,
                    hasNextPage: pageNumber < totalPages,
                    hasPrevPage: pageNumber > 1
                },
                filters: {
                    role,
                    isActive,
                    isEmailVerified,
                    startDate,
                    endDate,
                    search,
                    sortBy,
                    sortOrder
                }
            }
        });
    }
    catch (error) {
        console.error('Get all users error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve users',
            error: process.env.NODE_ENV === 'development' ? error : undefined
        });
    }
};
exports.getAllUsers = getAllUsers;
const getDashboardStats = async (req, res) => {
    try {
        const registrationStats = await models_1.Registration.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);
        const registrationsByType = await models_1.Registration.aggregate([
            {
                $group: {
                    _id: '$registrationType',
                    count: { $sum: 1 }
                }
            }
        ]);
        const Vote = (await Promise.resolve().then(() => __importStar(require('../models/Vote')))).default;
        const voteReferences = (await Vote.distinct('paymentReference')).filter((ref) => ref != null);
        const paymentStats = await models_1.PaymentTransaction.aggregate([
            {
                $match: {
                    registrationId: { $ne: null, $exists: true },
                    reference: { $nin: voteReferences }
                }
            },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    totalAmount: { $sum: '$amount' }
                }
            }
        ]);
        console.log(paymentStats);
        const userStats = await models_1.User.aggregate([
            {
                $group: {
                    _id: '$role',
                    count: { $sum: 1 }
                }
            }
        ]);
        const recentRegistrations = await models_1.Registration.find()
            .populate('userId', 'firstName lastName email')
            .sort({ createdAt: -1 })
            .limit(10)
            .select('registrationNumber registrationType status createdAt personalInfo.firstName personalInfo.lastName')
            .lean();
        const recentTransactions = await models_1.PaymentTransaction.find({
            registrationId: { $ne: null, $exists: true },
            reference: { $nin: voteReferences }
        })
            .populate('userId', 'firstName lastName email')
            .populate('registrationId', 'registrationNumber')
            .sort({ createdAt: -1 })
            .limit(10)
            .lean();
        res.status(200).json({
            success: true,
            message: 'Dashboard statistics retrieved successfully',
            data: {
                registrations: {
                    byStatus: registrationStats,
                    byType: registrationsByType,
                    total: registrationStats.reduce((sum, stat) => sum + stat.count, 0)
                },
                payments: {
                    byStatus: paymentStats,
                    totalAmount: paymentStats.reduce((sum, stat) => sum + stat.totalAmount, 0),
                    totalTransactions: paymentStats.reduce((sum, stat) => sum + stat.count, 0)
                },
                users: {
                    byRole: userStats,
                    total: userStats.reduce((sum, stat) => sum + stat.count, 0)
                },
                recent: {
                    registrations: recentRegistrations,
                    transactions: recentTransactions
                }
            }
        });
    }
    catch (error) {
        console.error('Get dashboard stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve dashboard statistics',
            error: process.env.NODE_ENV === 'development' ? error : undefined
        });
    }
};
exports.getDashboardStats = getDashboardStats;
//# sourceMappingURL=adminController.js.map