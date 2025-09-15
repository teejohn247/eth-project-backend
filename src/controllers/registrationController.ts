import { Request, Response } from 'express';
import Registration from '../models/Registration';
import AuditionSchedule from '../models/AuditionSchedule';
import { AuthRequest } from '../types';

interface AuthenticatedRequest extends AuthRequest {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

// Get user's registrations
export const getUserRegistrations = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const registrations = await Registration.find({ userId: req.user?.id })
      .sort({ createdAt: -1 })
      .select('-paymentInfo.paymentResponse');

    res.status(200).json({
      success: true,
      message: 'Registrations retrieved successfully',
      data: registrations
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
      userId: req.user?.id,
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
      userId: req.user?.id,
      registrationType,
      personalInfo: {
        firstName: '',
        lastName: '',
        email: req.user?.email || '',
        phoneNo: '',
        dateOfBirth: new Date(),
        gender: 'Male'
      },
      talentInfo: {
        talentCategory: 'Singing',
        skillLevel: 'Beginner'
      },
      auditionInfo: {
        auditionLocation: 'Lagos',
        auditionDate: new Date(),
        auditionTime: '09:00'
      },
      termsConditions: {
        rulesAcceptance: false,
        promotionalAcceptance: false
      },
      paymentInfo: {
        amount: 1090,
        currency: 'NGN',
        paymentStatus: 'pending'
      }
    });

    await registration.save();

    res.status(201).json({
      success: true,
      message: 'Registration created successfully',
      data: registration
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

// Get specific registration
export const getRegistration = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const registration = await Registration.findOne({
      _id: id,
      userId: req.user?.id
    }).select('-paymentInfo.paymentResponse');

    if (!registration) {
      res.status(404).json({
        success: false,
        message: 'Registration not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Registration retrieved successfully',
      data: registration
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

    const registration = await Registration.findOne({
      _id: id,
      userId: req.user?.id
    });

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

    const registration = await Registration.findOne({
      _id: id,
      userId: req.user?.id
    });

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

    // Validate required fields
    const requiredSteps = 6; // personal, talent, group/guardian, audition, terms, payment
    if (registration.completedSteps.length < requiredSteps) {
      res.status(400).json({
        success: false,
        message: 'Please complete all required steps before submission'
      });
      return;
    }

    // Check payment status
    if (registration.paymentInfo.paymentStatus !== 'completed') {
      res.status(400).json({
        success: false,
        message: 'Payment must be completed before submission'
      });
      return;
    }

    registration.status = 'submitted';
    registration.submittedAt = new Date();
    await registration.save();

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
    const personalInfo = req.body;

    const registration = await Registration.findOneAndUpdate(
      { _id: id, userId: req.user?.id },
      { 
        personalInfo,
        $addToSet: { completedSteps: 1 },
        currentStep: Math.max(1, (await Registration.findById(id))?.currentStep || 0)
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
    const talentInfo = req.body;

    const registration = await Registration.findOneAndUpdate(
      { _id: id, userId: req.user?.id },
      { 
        talentInfo,
        $addToSet: { completedSteps: 2 },
        currentStep: Math.max(2, (await Registration.findById(id))?.currentStep || 0)
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
    const groupInfo = req.body;

    const registration = await Registration.findOneAndUpdate(
      { _id: id, userId: req.user?.id },
      { 
        groupInfo,
        $addToSet: { completedSteps: 3 },
        currentStep: Math.max(3, (await Registration.findById(id))?.currentStep || 0)
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
    const guardianInfo = req.body;

    const registration = await Registration.findOneAndUpdate(
      { _id: id, userId: req.user?.id },
      { 
        guardianInfo,
        $addToSet: { completedSteps: 4 },
        currentStep: Math.max(4, (await Registration.findById(id))?.currentStep || 0)
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

// Update audition information
export const updateAuditionInfo = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const auditionInfo = req.body;

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

    const registration = await Registration.findOneAndUpdate(
      { _id: id, userId: req.user?.id },
      { 
        auditionInfo,
        $addToSet: { completedSteps: 5 },
        currentStep: Math.max(5, (await Registration.findById(id))?.currentStep || 0)
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
    const termsConditions = req.body;

    const registration = await Registration.findOneAndUpdate(
      { _id: id, userId: req.user?.id },
      { 
        termsConditions: {
          ...termsConditions,
          signedAt: new Date()
        },
        $addToSet: { completedSteps: 6 },
        currentStep: Math.max(6, (await Registration.findById(id))?.currentStep || 0)
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
      userId: req.user?.id
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

    const registration = await Registration.findOne({
      _id: id,
      userId: req.user?.id
    });

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
