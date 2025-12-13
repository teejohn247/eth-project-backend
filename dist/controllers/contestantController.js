"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllVotes = exports.getContestantVotes = exports.verifyVotePayment = exports.voteForContestant = exports.getContestant = exports.getContestants = exports.promoteToContestant = void 0;
const Registration_1 = __importDefault(require("../models/Registration"));
const Contestant_1 = __importDefault(require("../models/Contestant"));
const Vote_1 = __importDefault(require("../models/Vote"));
const PaymentTransaction_1 = __importDefault(require("../models/PaymentTransaction"));
const crypto_1 = __importDefault(require("crypto"));
const promoteToContestant = async (req, res) => {
    try {
        const { registrationId } = req.params;
        if (req.user?.role !== 'admin') {
            res.status(403).json({
                success: false,
                message: 'Access denied. Admin role required.'
            });
            return;
        }
        const registration = await Registration_1.default.findById(registrationId)
            .populate('userId', 'firstName lastName email');
        if (!registration) {
            res.status(404).json({
                success: false,
                message: 'Registration not found'
            });
            return;
        }
        const existingContestant = await Contestant_1.default.findOne({ registrationId });
        if (existingContestant) {
            const contestantId = existingContestant._id;
            const contestantData = existingContestant.toObject();
            await Contestant_1.default.findByIdAndDelete(contestantId);
            res.status(200).json({
                success: true,
                message: 'Contestant removed successfully',
                data: {
                    ...contestantData,
                    removed: true
                }
            });
            return;
        }
        if (registration.status !== 'qualified' && registration.status !== 'approved' && registration.status !== 'submitted') {
            res.status(400).json({
                success: false,
                message: 'Registration must be qualified, approved, or submitted to become a contestant'
            });
            return;
        }
        const lastContestant = await Contestant_1.default.findOne({ contestantNumber: { $regex: /^CNT-\d+$/ } }, {}, { sort: { contestantNumber: -1 } }).lean();
        let nextNumber = 1;
        if (lastContestant && lastContestant.contestantNumber) {
            const match = lastContestant.contestantNumber.match(/CNT-(\d+)/);
            if (match) {
                nextNumber = parseInt(match[1], 10) + 1;
            }
        }
        const contestantNumber = `CNT-${nextNumber.toString().padStart(3, '0')}`;
        const contestant = new Contestant_1.default({
            userId: registration.userId,
            registrationId: registration._id,
            contestantNumber: contestantNumber,
            firstName: registration.personalInfo.firstName,
            lastName: registration.personalInfo.lastName,
            email: registration.personalInfo.email,
            phoneNo: registration.personalInfo.phoneNo,
            dateOfBirth: registration.personalInfo.dateOfBirth,
            age: registration.personalInfo.age,
            gender: registration.personalInfo.gender,
            state: registration.personalInfo.state,
            lga: registration.personalInfo.lga,
            talentCategory: registration.talentInfo.talentCategory,
            stageName: registration.talentInfo.stageName,
            skillLevel: registration.talentInfo.skillLevel,
            profilePhoto: registration.mediaInfo?.profilePhoto,
            videoUpload: registration.mediaInfo?.videoUpload,
            status: 'active',
            isQualified: registration.status === 'qualified',
            qualifiedAt: registration.status === 'qualified' ? new Date() : undefined,
            registrationNumber: registration.registrationNumber,
            registrationType: registration.registrationType,
            totalVotes: 0,
            totalVoteAmount: 0
        });
        await contestant.save();
        res.status(200).json({
            success: true,
            message: 'Registration promoted to contestant successfully',
            data: contestant
        });
    }
    catch (error) {
        console.error('Promote to contestant error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to promote registration to contestant',
            error: process.env.NODE_ENV === 'development' ? error : undefined
        });
    }
};
exports.promoteToContestant = promoteToContestant;
const getContestants = async (req, res) => {
    try {
        const { status, talentCategory, sortBy = 'contestantNumber', order = 'asc', page = 1, limit = 2000000, searchQuery } = req.query;
        const query = {};
        if (status) {
            query.status = status;
        }
        if (talentCategory) {
            query.talentCategory = talentCategory;
        }
        if (searchQuery) {
            const searchTerm = searchQuery.trim();
            if (searchTerm) {
                query.$or = [
                    { firstName: { $regex: searchTerm, $options: 'i' } },
                    { lastName: { $regex: searchTerm, $options: 'i' } },
                    {
                        $expr: {
                            $regexMatch: {
                                input: { $concat: ['$firstName', ' ', '$lastName'] },
                                regex: searchTerm,
                                options: 'i'
                            }
                        }
                    },
                    { contestantNumber: { $regex: searchTerm, $options: 'i' } }
                ];
            }
        }
        const sortOptions = {};
        sortOptions[sortBy] = order === 'desc' ? -1 : 1;
        const skip = (Number(page) - 1) * Number(limit);
        const contestants = await Contestant_1.default.find(query)
            .sort(sortOptions)
            .skip(skip)
            .limit(Number(limit))
            .populate('userId', 'firstName lastName email')
            .populate('registrationId', 'registrationNumber');
        const total = await Contestant_1.default.countDocuments(query);
        res.status(200).json({
            success: true,
            message: 'Contestants retrieved successfully',
            data: {
                contestants,
                pagination: {
                    currentPage: Number(page),
                    totalPages: Math.ceil(total / Number(limit)),
                    totalCount: total,
                    limit: Number(limit)
                }
            }
        });
    }
    catch (error) {
        console.error('Get contestants error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve contestants',
            error: process.env.NODE_ENV === 'development' ? error : undefined
        });
    }
};
exports.getContestants = getContestants;
const getContestant = async (req, res) => {
    try {
        const { contestantId } = req.params;
        const contestant = await Contestant_1.default.findById(contestantId)
            .populate('userId', 'firstName lastName email')
            .populate('registrationId');
        if (!contestant) {
            res.status(404).json({
                success: false,
                message: 'Contestant not found'
            });
            return;
        }
        res.status(200).json({
            success: true,
            message: 'Contestant retrieved successfully',
            data: contestant
        });
    }
    catch (error) {
        console.error('Get contestant error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve contestant',
            error: process.env.NODE_ENV === 'development' ? error : undefined
        });
    }
};
exports.getContestant = getContestant;
const voteForContestant = async (req, res) => {
    try {
        const { contestantId, contestantEmail, numberOfVotes, amountPaid, voterInfo, paymentReference, paymentMethod, notes } = req.body;
        if (!contestantId || !contestantEmail || !numberOfVotes || !amountPaid) {
            res.status(400).json({
                success: false,
                message: 'Missing required fields: contestantId, contestantEmail, numberOfVotes, and amountPaid are required'
            });
            return;
        }
        if (numberOfVotes < 1) {
            res.status(400).json({
                success: false,
                message: 'numberOfVotes must be at least 1'
            });
            return;
        }
        if (amountPaid < 0) {
            res.status(400).json({
                success: false,
                message: 'amountPaid must be greater than or equal to 0'
            });
            return;
        }
        const contestant = await Contestant_1.default.findById(contestantId);
        if (!contestant) {
            res.status(404).json({
                success: false,
                message: 'Contestant not found'
            });
            return;
        }
        if (contestant.email.toLowerCase() !== contestantEmail.toLowerCase()) {
            res.status(400).json({
                success: false,
                message: 'Contestant email does not match'
            });
            return;
        }
        const votePaymentReference = paymentReference || `VOTE_${Date.now()}_${crypto_1.default.randomBytes(8).toString('hex')}`;
        let paymentTransactionId = null;
        if (paymentReference || amountPaid > 0) {
            const paymentTransaction = new PaymentTransaction_1.default({
                registrationId: null,
                userId: null,
                reference: votePaymentReference,
                amount: amountPaid,
                currency: 'NGN',
                status: 'initiated',
                paymentMethod: paymentMethod
            });
            await paymentTransaction.save();
            paymentTransactionId = paymentTransaction._id;
        }
        const vote = new Vote_1.default({
            contestantId: contestant._id,
            contestantEmail: contestant.email,
            numberOfVotes,
            amountPaid,
            currency: 'NGN',
            voterInfo: voterInfo || {},
            paymentReference: votePaymentReference,
            paymentTransactionId,
            paymentStatus: 'pending',
            paymentMethod: paymentMethod,
            notes: notes
        });
        await vote.save();
        if (amountPaid === 0) {
            vote.paymentStatus = 'completed';
            await vote.save();
            contestant.totalVotes += numberOfVotes;
            await contestant.save();
        }
        await contestant.populate('userId', 'firstName lastName email');
        const updatedContestant = await Contestant_1.default.findById(contestant._id);
        res.status(201).json({
            success: true,
            message: 'Vote recorded successfully',
            data: {
                voteId: vote._id,
                contestantId: contestant._id,
                contestantNumber: contestant.contestantNumber,
                contestantName: `${contestant.firstName} ${contestant.lastName}`,
                numberOfVotes,
                amountPaid,
                paymentReference: votePaymentReference,
                paymentStatus: vote.paymentStatus,
                totalVotes: updatedContestant?.totalVotes || contestant.totalVotes,
                totalVoteAmount: updatedContestant?.totalVoteAmount || contestant.totalVoteAmount
            }
        });
    }
    catch (error) {
        console.error('Vote for contestant error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to record vote',
            error: process.env.NODE_ENV === 'development' ? error : undefined
        });
    }
};
exports.voteForContestant = voteForContestant;
const verifyVotePayment = async (req, res) => {
    try {
        const { paymentReference } = req.params;
        const paymentData = req.body;
        let vote = await Vote_1.default.findOne({ paymentReference })
            .populate('contestantId');
        if (!vote) {
            let contestantId = paymentData.contestantId || paymentData.metadata?.contestantId;
            let contestantEmail = paymentData.contestantEmail || paymentData.metadata?.contestantEmail || paymentData.customer?.email || paymentData.customerId;
            let numberOfVotes = paymentData.numberOfVotes || paymentData.metadata?.numberOfVotes || 1;
            let amountPaid = paymentData.amount || paymentData.amountPaid || paymentData.transAmount || paymentData.debitedAmount || 0;
            if (paymentData.metadata && Array.isArray(paymentData.metadata)) {
                const metadataMap = {};
                paymentData.metadata.forEach((item) => {
                    if (item.insightTag && item.insightTagValue) {
                        metadataMap[item.insightTag] = item.insightTagValue;
                    }
                });
                if (metadataMap.contestantId)
                    contestantId = metadataMap.contestantId;
                if (metadataMap.votesPurchased)
                    numberOfVotes = parseInt(metadataMap.votesPurchased) || numberOfVotes;
                if (metadataMap.amountPaid)
                    amountPaid = parseFloat(metadataMap.amountPaid) || amountPaid;
                if (metadataMap.contestantName && !contestantEmail) {
                    const contestantByName = await Contestant_1.default.findOne({
                        $or: [
                            { firstName: { $regex: metadataMap.contestantName.split(' ')[0], $options: 'i' } },
                            { lastName: { $regex: metadataMap.contestantName.split(' ').slice(1).join(' '), $options: 'i' } }
                        ]
                    });
                    if (contestantByName) {
                        contestantId = contestantByName._id.toString();
                        contestantEmail = contestantByName.email;
                    }
                }
            }
            if (paymentData.status === 0 || paymentData.status === '0') {
            }
            else if (paymentData.status === 1 || paymentData.status === '1') {
                res.status(400).json({
                    success: false,
                    message: 'Payment failed'
                });
                return;
            }
            if (!contestantId) {
                res.status(400).json({
                    success: false,
                    message: 'Contestant ID is required in payment data'
                });
                return;
            }
            const contestant = await Contestant_1.default.findById(contestantId);
            if (!contestant) {
                res.status(404).json({
                    success: false,
                    message: 'Contestant not found'
                });
                return;
            }
            const transactionAmount = typeof amountPaid === 'number' ? amountPaid : parseFloat(amountPaid) || paymentData.transAmount || 0;
            const paymentTransaction = new PaymentTransaction_1.default({
                registrationId: null,
                userId: null,
                reference: paymentReference,
                amount: transactionAmount,
                currency: paymentData.currencyCode || paymentData.currency || 'NGN',
                status: 'initiated',
                paymentMethod: paymentData.channelId?.toString() || paymentData.paymentMethod || paymentData.gateway || 'unknown',
                gatewayResponse: paymentData
            });
            await paymentTransaction.save();
            vote = new Vote_1.default({
                contestantId: contestant._id,
                contestantEmail: contestantEmail || contestant.email,
                numberOfVotes: typeof numberOfVotes === 'number' ? numberOfVotes : parseInt(numberOfVotes) || 1,
                amountPaid: typeof amountPaid === 'number' ? amountPaid : parseFloat(amountPaid) || 0,
                currency: paymentData.currencyCode || paymentData.currency || 'NGN',
                voterInfo: {
                    firstName: paymentData.customerFirstName || paymentData.voterInfo?.firstName,
                    lastName: paymentData.customerLastName || paymentData.voterInfo?.lastName,
                    email: paymentData.customerId || paymentData.voterInfo?.email,
                    phone: paymentData.customerPhoneNumber || paymentData.voterInfo?.phone
                },
                paymentReference: paymentReference,
                paymentTransactionId: paymentTransaction._id,
                paymentStatus: 'pending',
                paymentMethod: paymentData.channelId?.toString() || paymentData.paymentMethod || paymentData.gateway || 'unknown',
                notes: paymentData.statusMessage || paymentData.notes
            });
            await vote.save();
        }
        const previousStatus = vote.paymentStatus;
        vote.paymentStatus = 'completed';
        await vote.save();
        if (vote.paymentTransactionId) {
            const paymentTransaction = await PaymentTransaction_1.default.findById(vote.paymentTransactionId);
            if (paymentTransaction) {
                paymentTransaction.status = 'successful';
                paymentTransaction.gatewayResponse = paymentData;
                paymentTransaction.processedAt = new Date();
                await paymentTransaction.save();
            }
        }
        if (previousStatus !== 'completed') {
            const contestantId = vote.contestantId && typeof vote.contestantId === 'object' && vote.contestantId._id
                ? vote.contestantId._id
                : vote.contestantId;
            const contestant = await Contestant_1.default.findById(contestantId);
            if (contestant) {
                await Contestant_1.default.updateOne({ _id: contestantId }, {
                    $inc: {
                        totalVotes: vote.numberOfVotes,
                        totalVoteAmount: vote.amountPaid
                    }
                });
                console.log(`✅ Updated contestant ${contestant.contestantNumber}: +${vote.numberOfVotes} votes, +₦${vote.amountPaid}`);
            }
            else {
                console.error(`❌ Contestant not found for ID: ${contestantId}`);
            }
        }
        res.status(200).json({
            success: true,
            message: 'Vote payment verified successfully',
            data: {
                voteId: vote._id,
                paymentStatus: 'completed',
                contestantId: vote.contestantId?._id || vote.contestantId,
                numberOfVotes: vote.numberOfVotes,
                amountPaid: vote.amountPaid
            }
        });
    }
    catch (error) {
        console.error('Verify vote payment error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to verify vote payment',
            error: process.env.NODE_ENV === 'development' ? error : undefined
        });
    }
};
exports.verifyVotePayment = verifyVotePayment;
const getContestantVotes = async (req, res) => {
    try {
        const { contestantId } = req.params;
        const { page = 1, limit = 20, paymentStatus } = req.query;
        const query = { contestantId };
        if (paymentStatus)
            query.paymentStatus = paymentStatus;
        const skip = (Number(page) - 1) * Number(limit);
        const votes = await Vote_1.default.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit))
            .populate('contestantId', 'contestantNumber firstName lastName');
        const total = await Vote_1.default.countDocuments(query);
        res.status(200).json({
            success: true,
            message: 'Votes retrieved successfully',
            data: {
                votes,
                pagination: {
                    currentPage: Number(page),
                    totalPages: Math.ceil(total / Number(limit)),
                    totalCount: total,
                    limit: Number(limit)
                }
            }
        });
    }
    catch (error) {
        console.error('Get contestant votes error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve votes',
            error: process.env.NODE_ENV === 'development' ? error : undefined
        });
    }
};
exports.getContestantVotes = getContestantVotes;
const getAllVotes = async (req, res) => {
    try {
        const { page = 1, limit = 50, paymentStatus, contestantId, searchQuery, sortBy = 'createdAt', order = 'desc' } = req.query;
        const query = {};
        if (paymentStatus) {
            query.paymentStatus = paymentStatus;
        }
        if (contestantId) {
            query.contestantId = contestantId;
        }
        if (searchQuery) {
            const searchTerm = searchQuery.trim();
            if (searchTerm) {
                query.$or = [
                    { paymentReference: { $regex: searchTerm, $options: 'i' } },
                    { contestantEmail: { $regex: searchTerm, $options: 'i' } },
                    { 'voterInfo.firstName': { $regex: searchTerm, $options: 'i' } },
                    { 'voterInfo.lastName': { $regex: searchTerm, $options: 'i' } },
                    { 'voterInfo.email': { $regex: searchTerm, $options: 'i' } },
                    { 'voterInfo.phone': { $regex: searchTerm, $options: 'i' } },
                    {
                        $expr: {
                            $regexMatch: {
                                input: { $concat: ['$voterInfo.firstName', ' ', '$voterInfo.lastName'] },
                                regex: searchTerm,
                                options: 'i'
                            }
                        }
                    }
                ];
            }
        }
        const sortOptions = {};
        sortOptions[sortBy] = order === 'desc' ? -1 : 1;
        const skip = (Number(page) - 1) * Number(limit);
        const votes = await Vote_1.default.find(query)
            .sort(sortOptions)
            .skip(skip)
            .limit(Number(limit))
            .populate('contestantId', 'contestantNumber firstName lastName email profilePhoto')
            .populate('paymentTransactionId', 'reference amount currency status');
        const total = await Vote_1.default.countDocuments(query);
        res.status(200).json({
            success: true,
            message: 'Votes retrieved successfully',
            data: {
                votes,
                pagination: {
                    currentPage: Number(page),
                    totalPages: Math.ceil(total / Number(limit)),
                    totalCount: total,
                    limit: Number(limit)
                },
                filters: {
                    paymentStatus,
                    contestantId,
                    searchQuery
                }
            }
        });
    }
    catch (error) {
        console.error('Get all votes error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve votes',
            error: process.env.NODE_ENV === 'development' ? error : undefined
        });
    }
};
exports.getAllVotes = getAllVotes;
//# sourceMappingURL=contestantController.js.map