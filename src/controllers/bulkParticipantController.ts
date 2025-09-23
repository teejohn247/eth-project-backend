import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { BulkRegistration, User, Registration, OTP } from '../models';
import emailService from '../services/emailService';

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

// Resend OTP for bulk participant
export const resendBulkParticipantOTP = async (req: any, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

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

    // Generate new OTP for the participant
    const otpDoc = await OTP.createOTP(email, 'email_verification', 10);

    // Update participant with new OTP
    participant.otpToken = otpDoc.otp;
    participant.otpExpiresAt = otpDoc.expiresAt;
    participant.invitationStatus = 'pending';

    await bulkRegistration.save();

    // Send invitation email with new OTP
    try {
      await emailService.sendBulkParticipantInvitation(
        email, 
        otpDoc.otp, 
        participant.firstName, 
        bulkRegistration.bulkRegistrationNumber
      );

      // Update invitation status
      participant.invitationStatus = 'sent';
      participant.invitationSentAt = new Date();
      await bulkRegistration.save();

      res.status(200).json({
        success: true,
        message: 'New OTP sent successfully',
        data: {
          email,
          expiresAt: otpDoc.expiresAt,
          bulkRegistrationNumber: bulkRegistration.bulkRegistrationNumber
        }
      });

    } catch (emailError) {
      console.error('Failed to send invitation email:', emailError);
      res.status(500).json({
        success: false,
        message: 'Failed to send invitation email'
      });
    }

  } catch (error) {
    console.error('Resend bulk participant OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resend OTP',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};
