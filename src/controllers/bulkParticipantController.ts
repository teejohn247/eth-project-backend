import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { BulkRegistration, User, Registration, OTP } from '../models';
import { generateToken } from '../utils/jwt';
import bcrypt from 'bcryptjs';

// Verify bulk participant OTP and set password
export const verifyBulkParticipantOTP = async (req: any, res: Response): Promise<void> => {
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

    // Find the bulk registration participant
    const bulkRegistration = await BulkRegistration.findOne({
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

    // Check if participant already registered
    if (participant.participantId) {
      res.status(400).json({
        success: false,
        message: 'This participant has already completed registration'
      });
      return;
    }

    // Verify OTP
    const isValidOTP = await OTP.verifyOTP(email, otp, 'email_verification');
    if (!isValidOTP) {
      res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP'
      });
      return;
    }

    // Check if user with this email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
      return;
    }

    // Create new user account
    const hashedPassword = await bcrypt.hash(password, 12);
    const newUser = new User({
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

    // Create registration for the participant
    const registration = new Registration({
      userId: newUser._id,
      registrationType: 'individual',
      isBulkParticipant: true,
      bulkRegistrationId: bulkRegistration._id
    });

    await registration.save();

    // Update participant information in bulk registration
    participant.participantId = newUser._id;
    participant.registrationId = registration._id;
    participant.invitationStatus = 'registered';
    participant.registeredAt = new Date();

    await bulkRegistration.save();

    // Generate JWT token
    const token = generateToken(newUser);

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
          paymentRequired: false // Payment already made through bulk registration
        }
      }
    });

  } catch (error) {
    console.error('Verify bulk participant OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify OTP and create account',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

// Check bulk participant invitation status
export const checkBulkParticipantStatus = async (req: any, res: Response): Promise<void> => {
  try {
    const { email } = req.params;

    if (!email) {
      res.status(400).json({
        success: false,
        message: 'Email is required'
      });
      return;
    }

    // Find the bulk registration participant
    const bulkRegistration = await BulkRegistration.findOne({
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

  } catch (error) {
    console.error('Check bulk participant status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check participant status',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};
