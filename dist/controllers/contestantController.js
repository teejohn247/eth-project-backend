"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getContestantVotes = exports.verifyVotePayment = exports.voteForContestant = exports.getContestant = exports.getContestants = exports.promoteToContestant = void 0;
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
        const { status, talentCategory, sortBy = 'totalVotes', order = 'desc', page = 1, limit = 20, name, contestantNumber } = req.query;
        const query = {};
        if (status) {
            query.status = status;
        }
        if (talentCategory) {
            query.talentCategory = talentCategory;
        }
        const searchConditions = [];
        if (name) {
            const nameTerm = name.trim();
            if (nameTerm) {
                searchConditions.push({
                    $or: [
                        { firstName: { $regex: nameTerm, $options: 'i' } },
                        { lastName: { $regex: nameTerm, $options: 'i' } },
                        {
                            $expr: {
                                $regexMatch: {
                                    input: { $concat: ['$firstName', ' ', '$lastName'] },
                                    regex: nameTerm,
                                    options: 'i'
                                }
                            }
                        }
                    ]
                });
            }
        }
        if (contestantNumber) {
            const numberTerm = contestantNumber.trim();
            if (numberTerm) {
                searchConditions.push({
                    contestantNumber: { $regex: numberTerm, $options: 'i' }
                });
            }
        }
        if (searchConditions.length === 1) {
            Object.assign(query, searchConditions[0]);
        }
        else if (searchConditions.length > 1) {
            query.$and = searchConditions;
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
        if (contestant.status !== 'active') {
            res.status(400).json({
                success: false,
                message: `Cannot vote for contestant with status: ${contestant.status}`
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
        const vote = await Vote_1.default.findOne({ paymentReference })
            .populate('contestantId');
        if (!vote) {
            res.status(404).json({
                success: false,
                message: 'Vote not found'
            });
            return;
        }
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
        const previousStatus = vote.paymentStatus;
        vote.paymentStatus = mappedStatus;
        await vote.save();
        if (vote.paymentTransactionId) {
            const paymentTransaction = await PaymentTransaction_1.default.findById(vote.paymentTransactionId);
            if (paymentTransaction) {
                paymentTransaction.status = mappedStatus === 'completed' ? 'successful' :
                    mappedStatus === 'failed' ? 'failed' : 'pending';
                paymentTransaction.gatewayResponse = paymentData;
                if (mappedStatus === 'completed') {
                    paymentTransaction.processedAt = new Date();
                }
                await paymentTransaction.save();
            }
        }
        if (mappedStatus === 'completed' && previousStatus !== 'completed') {
            const contestant = await Contestant_1.default.findById(vote.contestantId);
            if (contestant) {
                contestant.totalVotes += vote.numberOfVotes;
                contestant.totalVoteAmount += vote.amountPaid;
                await contestant.save();
            }
        }
        if (mappedStatus === 'failed' && previousStatus === 'completed') {
            const contestant = await Contestant_1.default.findById(vote.contestantId);
            if (contestant) {
                contestant.totalVotes = Math.max(0, contestant.totalVotes - vote.numberOfVotes);
                contestant.totalVoteAmount = Math.max(0, contestant.totalVoteAmount - vote.amountPaid);
                await contestant.save();
            }
        }
        res.status(200).json({
            success: true,
            message: 'Vote payment verified successfully',
            data: {
                voteId: vote._id,
                paymentStatus: mappedStatus,
                contestantId: vote.contestantId,
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
//# sourceMappingURL=contestantController.js.map