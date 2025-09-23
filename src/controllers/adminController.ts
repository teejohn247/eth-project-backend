import { Request, Response } from 'express';
import { Registration, PaymentTransaction, User } from '../models';
import { AuthenticatedRequest } from '../types';

// Get all registrations (admin only)
export const getAllRegistrations = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      status, 
      registrationType, 
      registrationNumber,
      startDate, 
      endDate,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const pageNumber = parseInt(page as string);
    const limitNumber = parseInt(limit as string);
    const skip = (pageNumber - 1) * limitNumber;

    // Build filter object
    const filter: any = {};

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
        filter.createdAt.$gte = new Date(startDate as string);
      }
      if (endDate) {
        filter.createdAt.$lte = new Date(endDate as string);
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

    // Build sort object
    const sort: any = {};
    sort[sortBy as string] = sortOrder === 'desc' ? -1 : 1;

    // Get registrations with pagination
    const registrations = await Registration.find(filter)
      .populate('userId', 'firstName lastName email role createdAt')
      .populate('paidBy', 'firstName lastName email role')
      .sort(sort)
      .skip(skip)
      .limit(limitNumber)
      .lean();

    // Get total count for pagination
    const totalCount = await Registration.countDocuments(filter);
    const totalPages = Math.ceil(totalCount / limitNumber);

    // Enhance registrations with bulk data
    const enhancedRegistrations = await Promise.all(
      registrations.map(async (registration: any) => {
        // Transform paidBy to sponsor
        if (registration.paidBy) {
          registration.sponsor = registration.paidBy;
          delete registration.paidBy;
        }

        // Add bulk registration details for bulk registrations and bulk participants
        if ((registration.registrationType === 'bulk' && registration.bulkRegistrationId) || 
            (registration.isBulkParticipant && registration.bulkRegistrationId)) {
          try {
            const { BulkRegistration } = await import('../models');
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
          } catch (error) {
            console.error('Failed to fetch bulk registration info for admin registrations:', error);
          }
        }
        return registration;
      })
    );

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
  } catch (error) {
    console.error('Get all registrations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve registrations',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

// Get all payment transactions (admin only)
export const getAllTransactions = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { 
      page = 1, 
      limit = 20, 
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
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const pageNumber = parseInt(page as string);
    const limitNumber = parseInt(limit as string);
    const skip = (pageNumber - 1) * limitNumber;

    // Build filter object
    const filter: any = {};

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
        filter.createdAt.$gte = new Date(startDate as string);
      }
      if (endDate) {
        filter.createdAt.$lte = new Date(endDate as string);
      }
    }

    if (amountMin || amountMax) {
      filter.amount = {};
      if (amountMin) {
        filter.amount.$gte = parseFloat(amountMin as string);
      }
      if (amountMax) {
        filter.amount.$lte = parseFloat(amountMax as string);
      }
    }

    if (search) {
      filter.$or = [
        { reference: { $regex: search, $options: 'i' } },
        { gatewayReference: { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort object
    const sort: any = {};
    sort[sortBy as string] = sortOrder === 'desc' ? -1 : 1;

    // Get transactions with pagination
    const transactions = await PaymentTransaction.find(filter)
      .populate('userId', 'firstName lastName email')
      .populate('registrationId', 'registrationNumber registrationType status')
      .sort(sort)
      .skip(skip)
      .limit(limitNumber)
      .lean();

    // Get total count for pagination
    const totalCount = await PaymentTransaction.countDocuments(filter);
    const totalPages = Math.ceil(totalCount / limitNumber);

    // Calculate summary statistics
    const summaryPipeline = [
      { $match: filter },
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

    const summaryResult = await PaymentTransaction.aggregate(summaryPipeline);
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
  } catch (error) {
    console.error('Get all transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve payment transactions',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

// Get all users (admin only)
export const getAllUsers = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      role, 
      isActive,
      isEmailVerified,
      startDate, 
      endDate,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const pageNumber = parseInt(page as string);
    const limitNumber = parseInt(limit as string);
    const skip = (pageNumber - 1) * limitNumber;

    // Build filter object
    const filter: any = {};

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
        filter.createdAt.$gte = new Date(startDate as string);
      }
      if (endDate) {
        filter.createdAt.$lte = new Date(endDate as string);
      }
    }

    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort object
    const sort: any = {};
    sort[sortBy as string] = sortOrder === 'desc' ? -1 : 1;

    // Get users with pagination (exclude password field)
    const users = await User.find(filter)
      .select('-password')
      .sort(sort)
      .skip(skip)
      .limit(limitNumber)
      .lean();

    // Get total count for pagination
    const totalCount = await User.countDocuments(filter);
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
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve users',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

// Get dashboard statistics (admin only)
export const getDashboardStats = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    // Get registration statistics
    const registrationStats = await Registration.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const registrationsByType = await Registration.aggregate([
      {
        $group: {
          _id: '$registrationType',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get payment statistics
    const paymentStats = await PaymentTransaction.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);

    // Get user statistics
    const userStats = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get recent registrations
    const recentRegistrations = await Registration.find()
      .populate('userId', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .limit(10)
      .select('registrationNumber registrationType status createdAt personalInfo.firstName personalInfo.lastName')
      .lean();

    // Get recent transactions
    const recentTransactions = await PaymentTransaction.find()
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
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve dashboard statistics',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};
