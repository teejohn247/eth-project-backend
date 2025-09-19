import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';

// Handle validation errors
export const handleValidationErrors = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
    return;
  }
  next();
};

// Registration validation
export const validateRegistration = [
  body('registrationType')
    .isIn(['individual', 'group'])
    .withMessage('Registration type must be either individual or group'),
  handleValidationErrors
];

// Personal information validation
export const validatePersonalInfo = [
  body('nextStep')
    .optional()
    .isInt({ min: 1, max: 8 })
    .withMessage('Next step must be a number between 1 and 8'),

  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('phoneNo')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('Phone number cannot exceed 20 characters'),
  
  body('dateOfBirth')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid date of birth'),
  
  body('gender')
    .isIn(['Male', 'Female'])
    .withMessage('Gender must be either Male or Female'),
  
  body('placeOfBirth')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Place of birth cannot exceed 100 characters'),
  
  body('maritalStatus')
    .optional()
    .isIn(['Single', 'Married'])
    .withMessage('Marital status must be either Single or Married'),
  
  body('address')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Address cannot exceed 200 characters'),
  
  body('state')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('State cannot exceed 50 characters'),
  
  body('lga')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('LGA cannot exceed 50 characters'),
  
  body('nationality')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Nationality cannot exceed 50 characters'),
  
  body('tshirtSize')
    .isIn(['XS', 'S', 'M', 'L', 'XL', 'XXL'])
    .withMessage('T-shirt size must be one of: XS, S, M, L, XL, XXL'),
  
  handleValidationErrors
];

// Talent information validation
export const validateTalentInfo = [
  body('nextStep')
    .optional()
    .isInt({ min: 1, max: 8 })
    .withMessage('Next step must be a number between 1 and 8'),

  body('talentCategory')
    .isIn(['Singing', 'Dancing', 'Acting', 'Comedy', 'Drama', 'Instrumental', 'Other'])
    .withMessage('Please select a valid talent category'),
  
  body('otherTalentCategory')
    .if(body('talentCategory').equals('Other'))
    .notEmpty()
    .withMessage('Please specify other talent category')
    .isLength({ max: 50 })
    .withMessage('Other talent category cannot exceed 50 characters'),
  
  body('skillLevel')
    .isIn(['Beginner', 'Intermediate', 'Advanced'])
    .withMessage('Please select a valid skill level'),
  
  body('stageName')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Stage name cannot exceed 50 characters'),
  
  body('previouslyParticipated')
    .optional()
    .isIn(['Yes', 'No'])
    .withMessage('Previously participated must be Yes or No'),
  
  // Previous participation details (required if previouslyParticipated = 'Yes')
  body('previousParticipationCategory')
    .if(body('previouslyParticipated').equals('Yes'))
    .isIn(['Singing', 'Dancing', 'Acting', 'Comedy', 'Drama', 'Instrumental', 'Other'])
    .withMessage('Please select a valid previous participation category'),
  
  body('previousParticipationOtherCategory')
    .if(body('previouslyParticipated').equals('Yes'))
    .if(body('previousParticipationCategory').equals('Other'))
    .notEmpty()
    .withMessage('Please specify other participation category')
    .isLength({ max: 50 })
    .withMessage('Other participation category cannot exceed 50 characters'),
  
  body('competitionName')
    .if(body('previouslyParticipated').equals('Yes'))
    .notEmpty()
    .withMessage('Competition name is required for previous participation')
    .isLength({ max: 100 })
    .withMessage('Competition name cannot exceed 100 characters'),
  
  body('participationPosition')
    .if(body('previouslyParticipated').equals('Yes'))
    .optional()
    .isLength({ max: 50 })
    .withMessage('Position cannot exceed 50 characters'),
  
  handleValidationErrors
];

// Group information validation
export const validateGroupInfo = [
  body('nextStep')
    .optional()
    .isInt({ min: 1, max: 8 })
    .withMessage('Next step must be a number between 1 and 8'),

  body('groupName')
    .notEmpty()
    .withMessage('Group name is required')
    .isLength({ max: 100 })
    .withMessage('Group name cannot exceed 100 characters'),
  
  body('noOfGroupMembers')
    .custom((value) => {
      // Convert string to number for validation
      const num = parseInt(value, 10);
      if (isNaN(num) || num < 2 || num > 5) {
        throw new Error('Number of group members must be between 2 and 5');
      }
      return true;
    }),
  
  body('members')
    .isArray({ min: 2, max: 5 })
    .withMessage('Group must have between 2 and 5 members'),
  
  body('members.*.firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Member first name must be between 2 and 50 characters'),
  
  body('members.*.lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Member last name must be between 2 and 50 characters'),
  
  body('members.*.dateOfBirth')
    .isISO8601()
    .withMessage('Member date of birth must be valid'),
  
  body('members.*.gender')
    .isIn(['Male', 'Female'])
    .withMessage('Member gender must be Male or Female'),
  
  body('members.*.tshirtSize')
    .custom((value) => {
      const validSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
      if (!validSizes.includes(value.toUpperCase())) {
        throw new Error('Member t-shirt size must be one of: XS, S, M, L, XL, XXL');
      }
      return true;
    }),
  
  handleValidationErrors
];

// Guardian information validation (for contestants under 16)
export const validateGuardianInfo = [
  body('title')
    .optional()
    .isIn(['Mr', 'Mrs', 'Miss'])
    .withMessage('Guardian title must be Mr, Mrs, or Miss'),
  
  body('guardianName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Guardian name must be between 2 and 100 characters'),
  
  body('relationship')
    .optional()
    .isIn(['Father', 'Mother', 'Aunt', 'Uncle', 'Brother', 'Sister', 'Other'])
    .withMessage('Please select a valid relationship'),
  
  body('otherRelationship')
    .if(body('relationship').equals('Other'))
    .notEmpty()
    .withMessage('Please specify other relationship')
    .isLength({ max: 50 })
    .withMessage('Other relationship cannot exceed 50 characters'),
  
  body('guardianEmail')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid guardian email address'),
  
  body('guardianPhoneNo')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('Guardian phone number cannot exceed 20 characters'),
  
  handleValidationErrors
];

// Audition information validation
export const validateAuditionInfo = [
  body('nextStep')
    .optional()
    .isInt({ min: 1, max: 8 })
    .withMessage('Next step must be a number between 1 and 8'),

  body('auditionLocation')
    .notEmpty()
    .withMessage('Audition location is required')
    .isLength({ max: 100 })
    .withMessage('Audition location cannot exceed 100 characters'),
  
  body('auditionDate')
    .isISO8601()
    .withMessage('Please provide a valid audition date')
    .custom((value) => {
      const auditionDate = new Date(value);
      const today = new Date();
      
      if (auditionDate <= today) {
        throw new Error('Audition date must be in the future');
      }
      return true;
    }),
  
  body('auditionTime')
    .custom((value) => {
      // Accept both 12-hour (9:29 AM) and 24-hour (09:29) formats
      const format24h = /^([01]\d|2[0-3]):([0-5]\d)$/.test(value);
      const format12h = /^(1[0-2]|0?[1-9]):([0-5]\d)\s?(AM|PM)$/i.test(value);
      
      if (!format24h && !format12h) {
        throw new Error('Please provide a valid audition time (e.g., "9:29 AM" or "09:29")');
      }
      return true;
    }),
  
  // Handle both correct and typo versions of auditionRequirement
  body('auditionRequirement')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Audition requirement cannot exceed 100 characters'),
  
  body('audtionRequirement')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Audition requirement cannot exceed 100 characters'),
  
  body('otherRequirement')
    .if((value, { req }) => {
      return req.body.auditionRequirement === 'Other' || req.body.audtionRequirement === 'Other';
    })
    .notEmpty()
    .withMessage('Please specify other requirement')
    .isLength({ max: 100 })
    .withMessage('Other requirement cannot exceed 100 characters'),
  
  body('hasInstrument')
    .optional()
    .isIn(['Yes', 'No'])
    .withMessage('Has instrument must be Yes or No'),
  
  handleValidationErrors
];

// Terms and conditions validation
export const validateTermsConditions = [
  body('nextStep')
    .optional()
    .isInt({ min: 1, max: 8 })
    .withMessage('Next step must be a number between 1 and 8'),

  body('rulesAcceptance')
    .isBoolean()
    .custom((value) => {
      if (!value) {
        throw new Error('You must accept the competition rules');
      }
      return true;
    }),
  
  body('promotionalAcceptance')
    .isBoolean()
    .custom((value) => {
      if (!value) {
        throw new Error('You must accept promotional terms');
      }
      return true;
    }),
  
  body('contestantSignature')
    .isString()
    .notEmpty()
    .withMessage('Contestant signature is required')
    .custom((value) => {
      if (value && !value.startsWith('data:image/')) {
        throw new Error('Contestant signature must be a valid base64 image data URL');
      }
      return true;
    }),
  
  body('guardianSignature')
    .optional()
    .custom((value, { req }) => {
      // Validate base64 format if provided
      if (value && !value.startsWith('data:image/')) {
        throw new Error('Guardian signature must be a valid base64 image data URL');
      }
      
      // Check if guardian signature is required (contestant under 16)
      // Note: This check would need access to the registration data, which might not be available here
      // The controller should handle age-based requirement validation
      return true;
    }),
  
  handleValidationErrors
];

// Payment validation
export const validatePayment = [
  body('amount')
    .isNumeric()
    .custom((value) => {
      if (value !== 1090) {
        throw new Error('Registration fee must be ₦1,090');
      }
      return true;
    }),
  
  body('currency')
    .optional()
    .equals('NGN')
    .withMessage('Currency must be NGN'),
  
  handleValidationErrors
];

// Media information validation
export const validateMediaInfo = [
  body('nextStep')
    .optional()
    .isInt({ min: 1, max: 8 })
    .withMessage('Next step must be a number between 1 and 8'),

  body('profilePhoto')
    .optional()
    .isString()
    .withMessage('Profile photo must be a valid base64 string')
    .custom((value) => {
      if (value && !value.startsWith('data:image/')) {
        throw new Error('Profile photo must be a valid base64 image data URL');
      }
      return true;
    }),
  
  body('videoUpload')
    .optional()
    .isString()
    .withMessage('Video upload must be a valid base64 string')
    .custom((value) => {
      if (value && !value.startsWith('data:video/')) {
        throw new Error('Video upload must be a valid base64 video data URL');
      }
      return true;
    }),
  
  handleValidationErrors
];

// File upload validation
export const validateFileUpload = [
  body('fileType')
    .isIn(['image', 'video'])
    .withMessage('File type must be image or video'),
  
  handleValidationErrors
];

// Admin validation for registration status updates
export const validateRegistrationStatusUpdate = [
  body('status')
    .isIn(['under_review', 'approved', 'rejected', 'qualified', 'disqualified'])
    .withMessage('Invalid status value'),
  
  body('reviewNotes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Review notes cannot exceed 500 characters'),
  
  handleValidationErrors
];

// Evaluation validation
export const validateEvaluation = [
  body('scores.talent')
    .isFloat({ min: 0, max: 10 })
    .withMessage('Talent score must be between 0 and 10'),
  
  body('scores.presentation')
    .isFloat({ min: 0, max: 10 })
    .withMessage('Presentation score must be between 0 and 10'),
  
  body('scores.creativity')
    .isFloat({ min: 0, max: 10 })
    .withMessage('Creativity score must be between 0 and 10'),
  
  body('scores.overall')
    .isFloat({ min: 0, max: 10 })
    .withMessage('Overall score must be between 0 and 10'),
  
  body('recommendation')
    .isIn(['advance', 'eliminate', 'callback'])
    .withMessage('Recommendation must be advance, eliminate, or callback'),
  
  body('feedback.strengths')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Strengths feedback cannot exceed 500 characters'),
  
  body('feedback.areasForImprovement')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Areas for improvement cannot exceed 500 characters'),
  
  body('feedback.generalComments')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('General comments cannot exceed 1000 characters'),
  
  handleValidationErrors
];