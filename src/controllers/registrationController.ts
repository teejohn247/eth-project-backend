import { Request, Response } from 'express';
import Registration from '../models/Registration';
import AuditionSchedule from '../models/AuditionSchedule';
import { AuthenticatedRequest } from '../types';
import mongoose from 'mongoose';
import cloudinaryService from '../services/cloudinaryService';

// Helper function to find registration by either registrationId or userId
const findRegistrationByIdOrUserId = async (idParam: string, userId: string) => {
  // Check if the idParam is a valid MongoDB ObjectId
  const isValidObjectId = mongoose.Types.ObjectId.isValid(idParam);
  
  let registration;
  
  if (isValidObjectId) {
    // Try to find by registration _id first
    registration = await Registration.findOne({
      _id: idParam,
      userId: userId
    }).populate('paidBy', 'firstName lastName email role');
  }
  
  // If not found by _id or not a valid ObjectId, try to find by userId
  if (!registration) {
    // Check if idParam could be a userId (also a valid ObjectId)
    if (mongoose.Types.ObjectId.isValid(idParam)) {
      registration = await Registration.findOne({
        userId: idParam
      }).populate('paidBy', 'firstName lastName email role');
      
      // Verify that the user making the request owns this registration or is the user themselves
      if (registration && registration.userId.toString() !== userId && idParam !== userId) {
        return null; // Unauthorized access
      }
    } else {
      // If idParam is not a valid ObjectId, just search by current user's userId
      registration = await Registration.findOne({
        userId: userId
      }).populate('paidBy', 'firstName lastName email role');
    }
  }
  
  return registration;
};

// Get user's registrations
export const getUserRegistrations = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const registrations = await Registration.find({ userId: req.user?.userId })
      .populate('paidBy', 'firstName lastName email role')
      .sort({ createdAt: -1 })
      .select('-paymentInfo.paymentResponse');

    // Process each registration to add bulk details if applicable
    const enrichedRegistrations = await Promise.all(
      registrations.map(async (registration) => {
        const registrationData: any = registration.toObject();

        // Transform paidBy to sponsor
        if (registrationData.paidBy) {
          registrationData.sponsor = registrationData.paidBy;
          delete registrationData.paidBy;
        }

        // Add bulk registration details for bulk registrations and bulk participants
        if ((registration.registrationType === 'bulk' && registration.bulkRegistrationId) || 
            (registration.isBulkParticipant && registration.bulkRegistrationId)) {
          try {
            const { BulkRegistration } = await import('../models');
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
          } catch (error) {
            console.error('Failed to fetch bulk registration info:', error);
            // Don't fail the entire request if bulk info fetch fails
          }
        }

        return registrationData;
      })
    );

    res.status(200).json({
      success: true,
      message: 'Registrations retrieved successfully',
      data: enrichedRegistrations
    });
  } catch (error) {
    console.error('Get registrations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve registrations',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

// Create new registration
export const createRegistration = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { registrationType } = req.body;

    // Check if user already has an active registration
    const existingRegistration = await Registration.findOne({
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

    const registration = new Registration({
      userId: req.user?.userId,
      registrationType,
      paidBy: req.user?.userId // For individual/group registrations, they pay for themselves
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
  } catch (error) {
    console.error('Create registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create registration',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

// Add bulk slots to a registration
export const addBulkSlots = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { totalSlots } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized: User ID not found in token' });
      return;
    }

    // Validate slot count
    if (!totalSlots || totalSlots < 2 || totalSlots > 50) {
      res.status(400).json({ 
        success: false, 
        message: 'Total slots must be between 2 and 50' 
      });
      return;
    }

    // Find the registration
    const registration = await findRegistrationByIdOrUserId(id, userId);
    if (!registration) {
      res.status(404).json({
        success: false,
        message: 'Registration not found'
      });
      return;
    }

    // Verify this is a bulk registration
    if (registration.registrationType !== 'bulk') {
      res.status(400).json({
        success: false,
        message: 'This endpoint is only for bulk registrations'
      });
      return;
    }

    // Check if this specific registration already has bulk slots and they still exist
    if (registration.bulkRegistrationId) {
      const { BulkRegistration } = await import('../models');
      const existingBulkRegistration = await BulkRegistration.findById(registration.bulkRegistrationId);
      
      if (existingBulkRegistration) {
        res.status(400).json({
          success: false,
          message: 'This registration already has bulk slots configured.'
        });
        return;
      } else {
        // Clear the invalid reference if the bulk registration no longer exists
        registration.bulkRegistrationId = undefined;
        await registration.save();
      }
    }

    // Get price per slot
    const pricePerSlot = 10000;
    const totalAmount = totalSlots * pricePerSlot;

    // Create bulk registration
    const { BulkRegistration } = await import('../models');
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

    // Update the registration with bulk registration reference
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

  } catch (error) {
    console.error('Add bulk slots error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add bulk slots',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

// Process bulk payment for a registration
export const processBulkPayment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;
    const paymentData = req.body;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized: User ID not found in token' });
      return;
    }

    // Find the registration
    const registration = await findRegistrationByIdOrUserId(id, userId);
    if (!registration) {
      res.status(404).json({
        success: false,
        message: 'Registration not found'
      });
      return;
    }

    // Verify this is a bulk registration
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

    // Get the bulk registration
    const { BulkRegistration } = await import('../models');
    const bulkRegistration = await BulkRegistration.findById(registration.bulkRegistrationId);
    if (!bulkRegistration) {
      res.status(404).json({
        success: false,
        message: 'Bulk registration not found'
      });
      return;
    }

    // Extract payment information with flexible status mapping
    const transAmount = paymentData.transAmount || paymentData.amount || bulkRegistration.totalAmount;
    
    // Map various status formats to our enum
    let mappedStatus: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' = 'pending';
    const statusValue = paymentData.status || paymentData.transaction_status || paymentData.paymentStatus;
    
    if (statusValue === '0' || statusValue === 0 || 
        statusValue === 'successful' || statusValue === 'success' || 
        statusValue === 'completed' || statusValue === 'paid') {
      mappedStatus = 'completed';
    } else if (statusValue === '1' || statusValue === 1 || 
               statusValue === 'failed' || statusValue === 'failure' || 
               statusValue === 'declined' || statusValue === 'error') {
      mappedStatus = 'failed';
    } else if (statusValue === 'processing' || statusValue === 'pending') {
      mappedStatus = 'processing';
    }

    // Update bulk registration payment information
    bulkRegistration.paymentInfo = {
      paymentStatus: mappedStatus,
      paymentReference: paymentData.reference || paymentData.paymentReference || paymentData.transaction_reference,
      transactionId: paymentData.transactionId || paymentData.transaction_id || paymentData.id,
      paymentMethod: paymentData.paymentMethod || paymentData.payment_method || paymentData.channel,
      paidAt: mappedStatus === 'completed' ? new Date() : undefined,
      paymentResponse: paymentData
    };

    // Update bulk registration status based on payment
    if (mappedStatus === 'completed') {
      bulkRegistration.status = 'active';
      
      // Update user role to sponsor when they successfully pay for bulk registration
      try {
        const { User } = await import('../models');
        await User.findByIdAndUpdate(userId, { role: 'sponsor' });
        console.log(`✅ Updated user ${userId} role to sponsor after bulk payment`);
      } catch (error) {
        console.error('Failed to update user role to sponsor:', error);
        // Don't fail payment processing if role update fails
      }
    } else if (mappedStatus === 'failed') {
      bulkRegistration.status = 'payment_pending';
    }

    await bulkRegistration.save();

    // Update registration payment info
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

  } catch (error) {
    console.error('Process bulk payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process bulk payment',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

// Add participant to bulk registration
export const addParticipantToRegistration = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { firstName, lastName, email, phoneNo } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized: User ID not found in token' });
      return;
    }

    // Validate required fields
    if (!firstName || !lastName || !email) {
      res.status(400).json({ 
        success: false, 
        message: 'First name, last name, and email are required' 
      });
      return;
    }

    // Find the registration
    const registration = await findRegistrationByIdOrUserId(id, userId);
    if (!registration) {
      res.status(404).json({
        success: false,
        message: 'Registration not found'
      });
      return;
    }

    // Verify this is a bulk registration
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

    // Get the bulk registration
    const { BulkRegistration, User, OTP } = await import('../models');
    const bulkRegistration = await BulkRegistration.findById(registration.bulkRegistrationId);
    if (!bulkRegistration) {
      res.status(404).json({
        success: false,
        message: 'Bulk registration not found'
      });
      return;
    }

    // Verify payment is completed
    if (bulkRegistration.status !== 'active') {
      res.status(400).json({
        success: false,
        message: 'Payment must be completed before adding participants'
      });
      return;
    }

    // Check if we have available slots
    if (bulkRegistration.availableSlots <= 0) {
      res.status(400).json({ 
        success: false, 
        message: 'No available slots remaining' 
      });
      return;
    }

    // Check if email is already used in this bulk registration
    const existingParticipant = bulkRegistration.participants.find(p => p.email === email);
    if (existingParticipant) {
      res.status(400).json({ 
        success: false, 
        message: 'Email already used for another participant in this bulk registration' 
      });
      return;
    }

    // Check if email is already registered in the system
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({ 
        success: false, 
        message: 'Email already registered in the system' 
      });
      return;
    }

    // Generate OTP for the participant
    const otpDoc = await OTP.createOTP(email, 'email_verification', 10);

    // Add participant to bulk registration
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

    // Send invitation email with OTP
    try {
      const emailService = await import('../services/emailService');
      await emailService.default.sendBulkParticipantInvitation(
        email, 
        otpDoc.otp, 
        firstName, 
        bulkRegistration.bulkRegistrationNumber
      );

      // Update invitation status
      const participant = bulkRegistration.participants.find(p => p.email === email);
      if (participant) {
        participant.invitationStatus = 'sent';
        participant.invitationSentAt = new Date();
        await bulkRegistration.save();
      }

    } catch (emailError) {
      console.error('Failed to send invitation email:', emailError);
      // Don't fail the request if email fails, just log it
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

  } catch (error) {
    console.error('Add participant to registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add participant',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

// Get specific registration
export const getRegistration = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const registration = await findRegistrationByIdOrUserId(id, req.user?.userId!);

    if (!registration) {
      res.status(404).json({
        success: false,
        message: 'Registration not found'
      });
      return;
    }

    // Remove sensitive payment response data
    const registrationData: any = registration.toObject();
    if (registrationData.paymentInfo?.paymentResponse) {
      delete registrationData.paymentInfo.paymentResponse;
    }

    // Transform paidBy to sponsor
    if (registrationData.paidBy) {
      registrationData.sponsor = registrationData.paidBy;
      delete registrationData.paidBy;
    }

    // Add bulk registration details for bulk registrations and bulk participants
    if ((registration.registrationType === 'bulk' && registration.bulkRegistrationId) || 
        (registration.isBulkParticipant && registration.bulkRegistrationId)) {
      try {
        const { BulkRegistration } = await import('../models');
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
      } catch (error) {
        console.error('Failed to fetch bulk registration info for get registration:', error);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Registration retrieved successfully',
      data: [registrationData]
    });
  } catch (error) {
    console.error('Get registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve registration',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

// Update registration
export const updateRegistration = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const registration = await findRegistrationByIdOrUserId(id, req.user?.userId!);

    if (!registration) {
      res.status(404).json({
        success: false,
        message: 'Registration not found'
      });
      return;
    }

    // Prevent updates if registration is already submitted
    if (registration.status !== 'draft') {
      res.status(400).json({
        success: false,
        message: 'Cannot update a submitted registration'
      });
      return;
    }

    // Update registration
    Object.assign(registration, updateData);
    await registration.save();

    res.status(200).json({
      success: true,
      message: 'Registration updated successfully',
      data: registration
    });
  } catch (error) {
    console.error('Update registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update registration',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

// Submit registration
export const submitRegistration = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const registration = await findRegistrationByIdOrUserId(id, req.user?.userId!);

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

    // Validate required fields based on registration type
    const requiredSteps = registration.registrationType === 'individual' ? 
      [1, 2, 4, 6] : // personal, talent, guardian, audition/terms for individual (media step 5 is optional)
      [1, 2, 3, 6];  // personal, talent, group, audition/terms for group (media step 5 is optional)
    
    const missingSteps = requiredSteps.filter(step => !registration.completedSteps.includes(step));
    if (missingSteps.length > 0) {
      res.status(400).json({
        success: false,
        message: 'Please complete all required steps before submission',
        missingSteps
      });
      return;
    }

    // Check payment status (except for bulk participants - their payment is already handled)
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

    // If this is a bulk participant, update their status in the bulk registration
    if (registration.isBulkParticipant && registration.bulkRegistrationId) {
      try {
        const { BulkRegistration } = await import('../models');
        const bulkRegistration = await BulkRegistration.findById(registration.bulkRegistrationId);
        if (bulkRegistration) {
          const participant = bulkRegistration.participants.find(p => 
            p.registrationId?.toString() === registration._id.toString()
          );
          if (participant) {
            participant.invitationStatus = 'completed';
            await bulkRegistration.save();

            // Check if all participants have completed their registrations
            const allParticipantsCompleted = bulkRegistration.participants.every(p => 
              p.invitationStatus === 'completed'
            );

            if (allParticipantsCompleted) {
              // Update the main bulk registration status to completed
              bulkRegistration.status = 'completed';
              await bulkRegistration.save();

              // Also update the owner's bulk registration record to submitted
              const ownerBulkRegistration = await Registration.findOne({
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
      } catch (error) {
        console.error('Failed to update bulk participant status:', error);
        // Don't fail the registration submission if bulk status update fails
      }
    }

    res.status(200).json({
      success: true,
      message: 'Registration submitted successfully',
      data: registration
    });
  } catch (error) {
    console.error('Submit registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit registration',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

// Update personal information
export const updatePersonalInfo = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { nextStep, ...personalInfo } = req.body;

    // First find the registration using our helper
    const foundRegistration = await findRegistrationByIdOrUserId(id, req.user?.userId!);
    
    if (!foundRegistration) {
      res.status(404).json({
        success: false,
        message: 'Registration not found'
      });
      return;
    }

    // Determine the current step to set (use nextStep from frontend or default to step 1)
    const currentStepToSet = nextStep || 1;

    // Build update object with only provided fields
    const updateObject: any = {
      $addToSet: { completedSteps: 1 },
      currentStep: currentStepToSet
    };

    // Only update fields that are actually provided (not undefined)
    Object.keys(personalInfo).forEach(key => {
      if (personalInfo[key] !== undefined) {
        updateObject[`personalInfo.${key}`] = personalInfo[key];
      }
    });

    const registration = await Registration.findOneAndUpdate(
      { _id: foundRegistration._id, userId: req.user?.userId },
      updateObject,
      { new: true }
    );

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
  } catch (error) {
    console.error('Update personal info error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update personal information',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

// Update talent information
export const updateTalentInfo = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { nextStep, ...talentInfo } = req.body;

    // First find the registration using our helper
    const foundRegistration = await findRegistrationByIdOrUserId(id, req.user?.userId!);
    
    if (!foundRegistration) {
      res.status(404).json({
        success: false,
        message: 'Registration not found'
      });
      return;
    }

    // Determine the current step to set (use nextStep from frontend or default to step 2)
    const currentStepToSet = nextStep || 2;

    // Build update object with only provided fields
    const updateObject: any = {
      $addToSet: { completedSteps: 2 },
      currentStep: currentStepToSet
    };

    // Only update fields that are actually provided (not undefined)
    Object.keys(talentInfo).forEach(key => {
      if (talentInfo[key] !== undefined) {
        updateObject[`talentInfo.${key}`] = talentInfo[key];
      }
    });

    const registration = await Registration.findOneAndUpdate(
      { _id: foundRegistration._id, userId: req.user?.userId },
      updateObject,
      { new: true }
    );

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
  } catch (error) {
    console.error('Update talent info error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update talent information',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

// Update group information
export const updateGroupInfo = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { nextStep, ...bodyData } = req.body;
    let groupInfo = bodyData;

    // Normalize T-shirt sizes to uppercase and convert noOfGroupMembers to number
    if (groupInfo.members && Array.isArray(groupInfo.members)) {
      groupInfo.members = groupInfo.members.map((member: any) => ({
        ...member,
        tshirtSize: member.tshirtSize ? member.tshirtSize.toUpperCase() : member.tshirtSize
      }));
    }

    // Convert noOfGroupMembers from string to number
    if (groupInfo.noOfGroupMembers && typeof groupInfo.noOfGroupMembers === 'string') {
      groupInfo.noOfGroupMembers = parseInt(groupInfo.noOfGroupMembers, 10);
    }

    // First find the registration using our helper
    const foundRegistration = await findRegistrationByIdOrUserId(id, req.user?.userId!);
    
    if (!foundRegistration) {
      res.status(404).json({
        success: false,
        message: 'Registration not found'
      });
      return;
    }

    // Determine the current step to set (use nextStep from frontend or default to step 3)
    const currentStepToSet = nextStep || 3;

    // Build update object with only provided fields
    const updateObject: any = {
      $addToSet: { completedSteps: 3 },
      currentStep: currentStepToSet
    };

    // Only update fields that are actually provided (not undefined)
    Object.keys(groupInfo).forEach(key => {
      if (groupInfo[key] !== undefined) {
        updateObject[`groupInfo.${key}`] = groupInfo[key];
      }
    });

    const registration = await Registration.findOneAndUpdate(
      { _id: foundRegistration._id, userId: req.user?.userId },
      updateObject,
      { new: true }
    );

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
  } catch (error) {
    console.error('Update group info error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update group information',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

// Update guardian information
export const updateGuardianInfo = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { nextStep, ...guardianInfo } = req.body;

    // First find the registration using our helper
    const foundRegistration = await findRegistrationByIdOrUserId(id, req.user?.userId!);
    
    if (!foundRegistration) {
      res.status(404).json({
        success: false,
        message: 'Registration not found'
      });
      return;
    }

    // Build update object with only provided fields
    const updateObject: any = {
      $addToSet: { completedSteps: 4 },
      currentStep: nextStep || 4
    };

    // Only update fields that are actually provided (not undefined)
    Object.keys(guardianInfo).forEach(key => {
      if (guardianInfo[key] !== undefined) {
        updateObject[`guardianInfo.${key}`] = guardianInfo[key];
      }
    });

    const registration = await Registration.findOneAndUpdate(
      { _id: foundRegistration._id, userId: req.user?.userId },
      updateObject,
      { new: true }
    );

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
  } catch (error) {
    console.error('Update guardian info error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update guardian information',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

// Update media information (now handles form data uploads)
export const updateMediaInfo = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { nextStep } = req.body;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    // First find the registration using our helper
    const foundRegistration = await findRegistrationByIdOrUserId(id, req.user?.userId!);
    
    if (!foundRegistration) {
      res.status(404).json({
        success: false,
        message: 'Registration not found'
      });
      return;
    }

    const mediaInfo: any = {};

    // Handle profile photo upload to Cloudinary
    if (files?.profilePhoto && files.profilePhoto[0]) {
      try {
        const photoFile = files.profilePhoto[0];
        const photoPublicId = `user_${req.user?.userId}_profile_${Date.now()}`;
        const photoResult = await cloudinaryService.uploadImage(photoFile.buffer, photoPublicId);
        
        mediaInfo.profilePhoto = {
          url: photoResult.url,
          publicId: photoResult.publicId,
          format: photoResult.format,
          width: photoResult.width,
          height: photoResult.height,
          bytes: photoResult.bytes
        };
      } catch (error) {
        console.error('Profile photo upload error:', error);
        res.status(400).json({
          success: false,
          message: 'Failed to upload profile photo',
          error: process.env.NODE_ENV === 'development' ? error : undefined
        });
        return;
      }
    }

    // Handle video upload to Cloudinary
    if (files?.videoUpload && files.videoUpload[0]) {
      try {
        const videoFile = files.videoUpload[0];
        
        // File size is already validated by multer, but we can add additional checks
        if (videoFile.size > 100 * 1024 * 1024) { // 100MB limit
          res.status(400).json({
            success: false,
            message: 'Video file is too large. Maximum size is 100MB.',
            error: process.env.NODE_ENV === 'development' ? `File size: ${Math.round(videoFile.size / 1024 / 1024)}MB` : undefined
          });
          return;
        }

        const videoPublicId = `user_${req.user?.userId}_video_${Date.now()}`;
        const videoResult = await cloudinaryService.uploadVideo(videoFile.buffer, videoPublicId);
        
        // Generate thumbnail for the video
        const thumbnailUrl = cloudinaryService.generateVideoThumbnail(videoResult.publicId);
        
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
      } catch (error: any) {
        console.error('Video upload error:', error);
        
        // Provide user-friendly error messages
        let errorMessage = 'Failed to upload video';
        if (error.message.includes('Invalid video data format')) {
          errorMessage = 'Invalid video format. Please upload a valid video file (MP4, MOV, AVI, etc.)';
        } else if (error.message.includes('too large')) {
          errorMessage = 'Video file is too large. Please use a smaller file (max 100MB)';
        } else if (error.message.includes('rate limit')) {
          errorMessage = 'Upload rate limit exceeded. Please try again in a few minutes';
        } else if (error.message.includes('Invalid video format or corrupted file')) {
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

    // Update registration with media info
    const registration = await Registration.findOneAndUpdate(
      { _id: foundRegistration._id, userId: req.user?.userId },
      { 
        $set: {
          'mediaInfo.profilePhoto': mediaInfo.profilePhoto || foundRegistration.mediaInfo?.profilePhoto,
          'mediaInfo.videoUpload': mediaInfo.videoUpload || foundRegistration.mediaInfo?.videoUpload
        },
        $addToSet: { completedSteps: 5 },
        currentStep: nextStep || 5
      },
      { new: true }
    );

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
  } catch (error) {
    console.error('Update media info error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update media information',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

// Update audition information
export const updateAuditionInfo = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { nextStep, ...bodyData } = req.body;
    let auditionInfo = bodyData;

    // Handle frontend typo: map 'audtionRequirement' to 'auditionRequirement'
    if (auditionInfo.audtionRequirement && !auditionInfo.auditionRequirement) {
      auditionInfo.auditionRequirement = auditionInfo.audtionRequirement;
      delete auditionInfo.audtionRequirement;
    }

    // Validate audition slot availability
    const schedule = await AuditionSchedule.findOne({
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

    // First find the registration using our helper
    const foundRegistration = await findRegistrationByIdOrUserId(id, req.user?.userId!);
    
    if (!foundRegistration) {
      res.status(404).json({
        success: false,
        message: 'Registration not found'
      });
      return;
    }

    // Build update object with only provided fields
    const updateObject: any = {
      $addToSet: { completedSteps: 6 },
      currentStep: nextStep || 6
    };

    // Only update fields that are actually provided (not undefined)
    Object.keys(auditionInfo).forEach(key => {
      if (auditionInfo[key] !== undefined) {
        updateObject[`auditionInfo.${key}`] = auditionInfo[key];
      }
    });

    const registration = await Registration.findOneAndUpdate(
      { _id: foundRegistration._id, userId: req.user?.userId },
      updateObject,
      { new: true }
    );

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
  } catch (error) {
    console.error('Update audition info error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update audition information',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

// Update terms and conditions
export const updateTermsConditions = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { nextStep, ...termsConditions } = req.body;

    // First find the registration using our helper
    const foundRegistration = await findRegistrationByIdOrUserId(id, req.user?.userId!);
    
    if (!foundRegistration) {
      res.status(404).json({
        success: false,
        message: 'Registration not found'
      });
      return;
    }

    // Build update object with only provided fields
    const updateObject: any = {
      $addToSet: { completedSteps: 7 },
      currentStep: nextStep || 7
    };

    // Only update fields that are actually provided (not undefined)
    Object.keys(termsConditions).forEach(key => {
      if (termsConditions[key] !== undefined) {
        updateObject[`termsConditions.${key}`] = termsConditions[key];
      }
    });

    // Always update signedAt when terms are updated
    updateObject['termsConditions.signedAt'] = new Date();

    const registration = await Registration.findOneAndUpdate(
      { _id: foundRegistration._id, userId: req.user?.userId },
      updateObject,
      { new: true }
    );

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
  } catch (error) {
    console.error('Update terms conditions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update terms and conditions',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

// Get registration status
export const getRegistrationStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const registration = await Registration.findOne({
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
  } catch (error) {
    console.error('Get registration status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve registration status',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

// Delete registration (draft only)
export const deleteRegistration = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const registration = await findRegistrationByIdOrUserId(id, req.user?.userId!);

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

    await Registration.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Registration deleted successfully'
    });
  } catch (error) {
    console.error('Delete registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete registration',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};
