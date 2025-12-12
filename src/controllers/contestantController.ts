import { Request, Response } from 'express';
import Registration from '../models/Registration';
import Contestant from '../models/Contestant';
import Vote from '../models/Vote';
import PaymentTransaction from '../models/PaymentTransaction';
import crypto from 'crypto';
import { AuthenticatedRequest } from '../types';

// Promote registration to contestant
export const promoteToContestant = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { registrationId } = req.params;

    // Check if admin
    if (req.user?.role !== 'admin') {
      res.status(403).json({
        success: false,
        message: 'Access denied. Admin role required.'
      });
      return;
    }

    // Find registration
    const registration = await Registration.findById(registrationId)
      .populate('userId', 'firstName lastName email');

    if (!registration) {
      res.status(404).json({
        success: false,
        message: 'Registration not found'
      });
      return;
    }

    // Check if registration is already a contestant (toggle functionality)
    const existingContestant = await Contestant.findOne({ registrationId });
    if (existingContestant) {
      // Remove contestant (toggle off)
      const contestantId = existingContestant._id;
      const contestantData = existingContestant.toObject();
      
      // Delete the contestant
      await Contestant.findByIdAndDelete(contestantId);
      
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

    // Check if registration is qualified/submitted
    if (registration.status !== 'qualified' && registration.status !== 'approved' && registration.status !== 'submitted') {
      res.status(400).json({
        success: false,
        message: 'Registration must be qualified, approved, or submitted to become a contestant'
      });
      return;
    }

    // Generate contestant number (sequential: CNT-001, CNT-002, etc.)
    const lastContestant = await Contestant.findOne(
      { contestantNumber: { $regex: /^CNT-\d+$/ } },
      {},
      { sort: { contestantNumber: -1 } }
    ).lean();

    let nextNumber = 1;
    if (lastContestant && lastContestant.contestantNumber) {
      // Extract the number from the last contestant (e.g., "CNT-007" -> 7)
      const match = lastContestant.contestantNumber.match(/CNT-(\d+)/);
      if (match) {
        nextNumber = parseInt(match[1], 10) + 1;
      }
    }

    // Format as CNT-001, CNT-002, etc.
    const contestantNumber = `CNT-${nextNumber.toString().padStart(3, '0')}`;

    // Create contestant from registration data (toggle on)
    const contestant = new Contestant({
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
  } catch (error) {
    console.error('Promote to contestant error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to promote registration to contestant',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

// Get all contestants
export const getContestants = async (req: Request, res: Response): Promise<void> => {
  try {
    const { 
      status, 
      talentCategory, 
      sortBy = 'contestantNumber', 
      order = 'asc', 
      page = 1, 
      limit = 2000000,
      searchQuery
    } = req.query;

    const query: any = {};

    // Status filter
    if (status) {
      query.status = status;
    }

    // Talent category filter
    if (talentCategory) {
      query.talentCategory = talentCategory;
    }

    // Search query - searches both name and contestant number
    if (searchQuery) {
      const searchTerm = (searchQuery as string).trim();
      if (searchTerm) {
        // Search both name and contestant number
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

    const sortOptions: any = {};
    sortOptions[sortBy as string] = order === 'desc' ? -1 : 1;

    const skip = (Number(page) - 1) * Number(limit);

    const contestants = await Contestant.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(Number(limit))
      .populate('userId', 'firstName lastName email')
      .populate('registrationId', 'registrationNumber');

    const total = await Contestant.countDocuments(query);

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
  } catch (error) {
    console.error('Get contestants error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve contestants',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

// Get single contestant
export const getContestant = async (req: Request, res: Response): Promise<void> => {
  try {
    const { contestantId } = req.params;

    const contestant = await Contestant.findById(contestantId)
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
  } catch (error) {
    console.error('Get contestant error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve contestant',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

// Vote for contestant
export const voteForContestant = async (req: Request, res: Response): Promise<void> => {
  try {
    const { 
      contestantId, 
      contestantEmail,
      numberOfVotes, 
      amountPaid,
      voterInfo,
      paymentReference,
      paymentMethod,
      notes
    } = req.body;

    // Validate required fields
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

    // Find contestant
    const contestant = await Contestant.findById(contestantId);

    if (!contestant) {
      res.status(404).json({
        success: false,
        message: 'Contestant not found'
      });
      return;
    }

    // Verify email matches
    if (contestant.email.toLowerCase() !== contestantEmail.toLowerCase()) {
      res.status(400).json({
        success: false,
        message: 'Contestant email does not match'
      });
      return;
    }

    // Check if contestant is active
    if (contestant.status !== 'active') {
      res.status(400).json({
        success: false,
        message: `Cannot vote for contestant with status: ${contestant.status}`
      });
      return;
    }

    // Generate payment reference if not provided
    const votePaymentReference = paymentReference || `VOTE_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;

    // Create payment transaction for vote
    let paymentTransactionId = null;
    if (paymentReference || amountPaid > 0) {
      const paymentTransaction = new PaymentTransaction({
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

    // Create vote record
    const vote = new Vote({
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

    // If amountPaid is 0 (free votes), auto-complete the vote
    if (amountPaid === 0) {
      vote.paymentStatus = 'completed';
      await vote.save();
      
      // Update contestant vote statistics for free votes
      contestant.totalVotes += numberOfVotes;
      await contestant.save();
    }
    // Note: For paid votes, statistics will be updated when payment is verified via verifyVotePayment endpoint
    // This prevents double counting and ensures votes are only counted for successful payments

    // Refresh contestant to get updated vote counts
    await contestant.populate('userId', 'firstName lastName email');
    const updatedContestant = await Contestant.findById(contestant._id);

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
  } catch (error) {
    console.error('Vote for contestant error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record vote',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

// Verify vote payment
// This endpoint is called only on successful payment, so we always approve and process
// Accepts any payment reference and creates records if they don't exist
export const verifyVotePayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { paymentReference } = req.params;
    const paymentData = req.body; // Accept and save all data from frontend

    // Find vote by payment reference
    let vote = await Vote.findOne({ paymentReference })
      .populate('contestantId');

    if (!vote) {
      // Create vote record if it doesn't exist
      // Extract data from payment data (handle both formats)
      let contestantId = paymentData.contestantId || paymentData.metadata?.contestantId;
      let contestantEmail = paymentData.contestantEmail || paymentData.metadata?.contestantEmail || paymentData.customer?.email || paymentData.customerId;
      let numberOfVotes = paymentData.numberOfVotes || paymentData.metadata?.numberOfVotes || 1;
      let amountPaid = paymentData.amount || paymentData.amountPaid || paymentData.transAmount || paymentData.debitedAmount || 0;

      // Handle metadata array format (insightTag/insightTagValue)
      if (paymentData.metadata && Array.isArray(paymentData.metadata)) {
        const metadataMap: any = {};
        paymentData.metadata.forEach((item: any) => {
          if (item.insightTag && item.insightTagValue) {
            metadataMap[item.insightTag] = item.insightTagValue;
          }
        });
        
        if (metadataMap.contestantId) contestantId = metadataMap.contestantId;
        if (metadataMap.votesPurchased) numberOfVotes = parseInt(metadataMap.votesPurchased) || numberOfVotes;
        if (metadataMap.amountPaid) amountPaid = parseFloat(metadataMap.amountPaid) || amountPaid;
        if (metadataMap.contestantName && !contestantEmail) {
          // Try to find contestant by name if email not provided
          const contestantByName = await Contestant.findOne({
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

      // Handle status: 0 = success, 1 = failed
      if (paymentData.status === 0 || paymentData.status === '0') {
        // Payment successful, proceed
      } else if (paymentData.status === 1 || paymentData.status === '1') {
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

      // Find contestant
      const contestant = await Contestant.findById(contestantId);
      if (!contestant) {
        res.status(404).json({
          success: false,
          message: 'Contestant not found'
        });
        return;
      }

      // Create payment transaction
      const transactionAmount = typeof amountPaid === 'number' ? amountPaid : parseFloat(amountPaid) || paymentData.transAmount || 0;
      const paymentTransaction = new PaymentTransaction({
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

      // Create vote record
      vote = new Vote({
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

    // Always approve payment since this endpoint is only called on success
    const previousStatus = vote.paymentStatus;
    vote.paymentStatus = 'completed';
    await vote.save();

    // Update payment transaction if exists
    if (vote.paymentTransactionId) {
      const paymentTransaction = await PaymentTransaction.findById(vote.paymentTransactionId);
      if (paymentTransaction) {
        paymentTransaction.status = 'successful';
        paymentTransaction.gatewayResponse = paymentData; // Save all data from frontend
        paymentTransaction.processedAt = new Date();
        await paymentTransaction.save();
      }
    }

    // If payment wasn't already counted, update contestant stats
    if (previousStatus !== 'completed') {
      const contestant = await Contestant.findById(vote.contestantId);
      if (contestant) {
        contestant.totalVotes += vote.numberOfVotes;
        contestant.totalVoteAmount += vote.amountPaid;
        await contestant.save();
      }
    }

    res.status(200).json({
      success: true,
      message: 'Vote payment verified successfully',
      data: {
        voteId: vote._id,
        paymentStatus: 'completed',
        contestantId: vote.contestantId,
        numberOfVotes: vote.numberOfVotes,
        amountPaid: vote.amountPaid
      }
    });
  } catch (error) {
    console.error('Verify vote payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify vote payment',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

// Get votes for a contestant
export const getContestantVotes = async (req: Request, res: Response): Promise<void> => {
  try {
    const { contestantId } = req.params;
    const { page = 1, limit = 20, paymentStatus } = req.query;

    const query: any = { contestantId };
    if (paymentStatus) query.paymentStatus = paymentStatus;

    const skip = (Number(page) - 1) * Number(limit);

    const votes = await Vote.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate('contestantId', 'contestantNumber firstName lastName');

    const total = await Vote.countDocuments(query);

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
  } catch (error) {
    console.error('Get contestant votes error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve votes',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

