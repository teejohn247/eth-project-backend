import { Request, Response } from 'express';
import Registration from '../models/Registration';
import AuditionSchedule from '../models/AuditionSchedule';
import { AuthenticatedRequest } from '../types';
import mongoose from 'mongoose';

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
    });
  }
  
  // If not found by _id or not a valid ObjectId, try to find by userId
  if (!registration) {
    // Check if idParam could be a userId (also a valid ObjectId)
    if (mongoose.Types.ObjectId.isValid(idParam)) {
      registration = await Registration.findOne({
        userId: idParam
      });
      
      // Verify that the user making the request owns this registration or is the user themselves
      if (registration && registration.userId.toString() !== userId && idParam !== userId) {
        return null; // Unauthorized access
      }
    } else {
      // If idParam is not a valid ObjectId, just search by current user's userId
      registration = await Registration.findOne({
        userId: userId
      });
    }
  }
  
  return registration;
};

// Get user's registrations
export const getUserRegistrations = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const registrations = await Registration.find({ userId: req.user?.userId })
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
      registrationType
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
    
    const registration = await findRegistrationByIdOrUserId(id, req.user?.userId!);

    if (!registration) {
      res.status(404).json({
        success: false,
        message: 'Registration not found'
      });
      return;
    }

    // Remove sensitive payment response data
    const registrationData = registration.toObject();
    if (registrationData.paymentInfo?.paymentResponse) {
      delete registrationData.paymentInfo.paymentResponse;
    }

    res.status(200).json({
      success: true,
      message: 'Registration retrieved successfully',
      data: registrationData
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
      [1, 2, 4, 5, 6] : // personal, talent, guardian, audition, terms for individual
      [1, 2, 3, 5, 6];  // personal, talent, group, audition, terms for group
    
    const missingSteps = requiredSteps.filter(step => !registration.completedSteps.includes(step));
    if (missingSteps.length > 0) {
      res.status(400).json({
        success: false,
        message: 'Please complete all required steps before submission',
        missingSteps
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

    const registration = await Registration.findOneAndUpdate(
      { _id: foundRegistration._id, userId: req.user?.userId },
      { 
        personalInfo,
        $addToSet: { completedSteps: 1 },
        currentStep: currentStepToSet
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

    const registration = await Registration.findOneAndUpdate(
      { _id: foundRegistration._id, userId: req.user?.userId },
      { 
        talentInfo,
        $addToSet: { completedSteps: 2 },
        currentStep: currentStepToSet
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

    const registration = await Registration.findOneAndUpdate(
      { _id: foundRegistration._id, userId: req.user?.userId },
      { 
        groupInfo,
        $addToSet: { completedSteps: 3 },
        currentStep: currentStepToSet
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

    const registration = await Registration.findOneAndUpdate(
      { _id: foundRegistration._id, userId: req.user?.userId },
      { 
        guardianInfo,
        $addToSet: { completedSteps: 4 },
        currentStep: nextStep || 4
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

// Update media information
export const updateMediaInfo = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { nextStep, ...mediaInfo } = req.body;

    // First find the registration using our helper
    const foundRegistration = await findRegistrationByIdOrUserId(id, req.user?.userId!);
    
    if (!foundRegistration) {
      res.status(404).json({
        success: false,
        message: 'Registration not found'
      });
      return;
    }

    const registration = await Registration.findOneAndUpdate(
      { _id: foundRegistration._id, userId: req.user?.userId },
      { 
        mediaInfo,
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
      data: registration
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

    const registration = await Registration.findOneAndUpdate(
      { _id: foundRegistration._id, userId: req.user?.userId },
      { 
        auditionInfo,
        $addToSet: { completedSteps: 6 },
        currentStep: nextStep || 6
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

    const registration = await Registration.findOneAndUpdate(
      { _id: foundRegistration._id, userId: req.user?.userId },
      { 
        termsConditions: {
          ...termsConditions,
          signedAt: new Date()
        },
        $addToSet: { completedSteps: 7 },
        currentStep: nextStep || 7
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
