"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateEvaluation = exports.validateRegistrationStatusUpdate = exports.validateFileUpload = exports.validateMediaInfo = exports.validatePayment = exports.validateTermsConditions = exports.validateAuditionInfo = exports.validateGuardianInfo = exports.validateGroupInfo = exports.validateTalentInfo = exports.validatePersonalInfo = exports.validateRegistration = exports.handleValidationErrors = void 0;
const express_validator_1 = require("express-validator");
const handleValidationErrors = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
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
exports.handleValidationErrors = handleValidationErrors;
exports.validateRegistration = [
    (0, express_validator_1.body)('registrationType')
        .isIn(['individual', 'group'])
        .withMessage('Registration type must be either individual or group'),
    exports.handleValidationErrors
];
exports.validatePersonalInfo = [
    (0, express_validator_1.body)('firstName')
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('First name must be between 2 and 50 characters'),
    (0, express_validator_1.body)('lastName')
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Last name must be between 2 and 50 characters'),
    (0, express_validator_1.body)('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email address'),
    (0, express_validator_1.body)('phoneNo')
        .matches(/^(\+234|0)[789]\d{9}$/)
        .withMessage('Please provide a valid Nigerian phone number'),
    (0, express_validator_1.body)('dateOfBirth')
        .isISO8601()
        .withMessage('Please provide a valid date of birth')
        .custom((value) => {
        const birthDate = new Date(value);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        if (age < 5 || age > 40) {
            throw new Error('Age must be between 5 and 40 years');
        }
        return true;
    }),
    (0, express_validator_1.body)('gender')
        .isIn(['Male', 'Female'])
        .withMessage('Gender must be either Male or Female'),
    (0, express_validator_1.body)('placeOfBirth')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('Place of birth cannot exceed 100 characters'),
    (0, express_validator_1.body)('maritalStatus')
        .optional()
        .isIn(['Single', 'Married'])
        .withMessage('Marital status must be either Single or Married'),
    (0, express_validator_1.body)('address')
        .optional()
        .trim()
        .isLength({ max: 200 })
        .withMessage('Address cannot exceed 200 characters'),
    (0, express_validator_1.body)('state')
        .optional()
        .trim()
        .isLength({ max: 50 })
        .withMessage('State cannot exceed 50 characters'),
    (0, express_validator_1.body)('lga')
        .optional()
        .trim()
        .isLength({ max: 50 })
        .withMessage('LGA cannot exceed 50 characters'),
    (0, express_validator_1.body)('nationality')
        .optional()
        .trim()
        .isLength({ max: 50 })
        .withMessage('Nationality cannot exceed 50 characters'),
    (0, express_validator_1.body)('tshirtSize')
        .isIn(['XS', 'S', 'M', 'L', 'XL', 'XXL'])
        .withMessage('T-shirt size must be one of: XS, S, M, L, XL, XXL'),
    exports.handleValidationErrors
];
exports.validateTalentInfo = [
    (0, express_validator_1.body)('talentCategory')
        .isIn(['Singing', 'Dancing', 'Acting', 'Comedy', 'Drama', 'Instrumental', 'Other'])
        .withMessage('Please select a valid talent category'),
    (0, express_validator_1.body)('otherTalentCategory')
        .if((0, express_validator_1.body)('talentCategory').equals('Other'))
        .notEmpty()
        .withMessage('Please specify other talent category')
        .isLength({ max: 50 })
        .withMessage('Other talent category cannot exceed 50 characters'),
    (0, express_validator_1.body)('skillLevel')
        .isIn(['Beginner', 'Intermediate', 'Advanced'])
        .withMessage('Please select a valid skill level'),
    (0, express_validator_1.body)('stageName')
        .optional()
        .trim()
        .isLength({ max: 50 })
        .withMessage('Stage name cannot exceed 50 characters'),
    (0, express_validator_1.body)('previouslyParticipated')
        .optional()
        .isIn(['Yes', 'No'])
        .withMessage('Previously participated must be Yes or No'),
    (0, express_validator_1.body)('previousParticipationCategory')
        .if((0, express_validator_1.body)('previouslyParticipated').equals('Yes'))
        .isIn(['Singing', 'Dancing', 'Acting', 'Comedy', 'Drama', 'Instrumental', 'Other'])
        .withMessage('Please select a valid previous participation category'),
    (0, express_validator_1.body)('previousParticipationOtherCategory')
        .if((0, express_validator_1.body)('previouslyParticipated').equals('Yes'))
        .if((0, express_validator_1.body)('previousParticipationCategory').equals('Other'))
        .notEmpty()
        .withMessage('Please specify other participation category')
        .isLength({ max: 50 })
        .withMessage('Other participation category cannot exceed 50 characters'),
    (0, express_validator_1.body)('competitionName')
        .if((0, express_validator_1.body)('previouslyParticipated').equals('Yes'))
        .notEmpty()
        .withMessage('Competition name is required for previous participation')
        .isLength({ max: 100 })
        .withMessage('Competition name cannot exceed 100 characters'),
    (0, express_validator_1.body)('participationPosition')
        .if((0, express_validator_1.body)('previouslyParticipated').equals('Yes'))
        .optional()
        .isLength({ max: 50 })
        .withMessage('Position cannot exceed 50 characters'),
    exports.handleValidationErrors
];
exports.validateGroupInfo = [
    (0, express_validator_1.body)('groupName')
        .notEmpty()
        .withMessage('Group name is required')
        .isLength({ max: 100 })
        .withMessage('Group name cannot exceed 100 characters'),
    (0, express_validator_1.body)('noOfGroupMembers')
        .custom((value) => {
        const num = parseInt(value, 10);
        if (isNaN(num) || num < 2 || num > 5) {
            throw new Error('Number of group members must be between 2 and 5');
        }
        return true;
    }),
    (0, express_validator_1.body)('members')
        .isArray({ min: 2, max: 5 })
        .withMessage('Group must have between 2 and 5 members'),
    (0, express_validator_1.body)('members.*.firstName')
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Member first name must be between 2 and 50 characters'),
    (0, express_validator_1.body)('members.*.lastName')
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Member last name must be between 2 and 50 characters'),
    (0, express_validator_1.body)('members.*.dateOfBirth')
        .isISO8601()
        .withMessage('Member date of birth must be valid'),
    (0, express_validator_1.body)('members.*.gender')
        .isIn(['Male', 'Female'])
        .withMessage('Member gender must be Male or Female'),
    (0, express_validator_1.body)('members.*.tshirtSize')
        .custom((value) => {
        const validSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
        if (!validSizes.includes(value.toUpperCase())) {
            throw new Error('Member t-shirt size must be one of: XS, S, M, L, XL, XXL');
        }
        return true;
    }),
    exports.handleValidationErrors
];
exports.validateGuardianInfo = [
    (0, express_validator_1.body)('title')
        .optional()
        .isIn(['Mr', 'Mrs', 'Miss'])
        .withMessage('Guardian title must be Mr, Mrs, or Miss'),
    (0, express_validator_1.body)('guardianName')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Guardian name must be between 2 and 100 characters'),
    (0, express_validator_1.body)('relationship')
        .optional()
        .isIn(['Father', 'Mother', 'Aunt', 'Uncle', 'Brother', 'Sister', 'Other'])
        .withMessage('Please select a valid relationship'),
    (0, express_validator_1.body)('otherRelationship')
        .if((0, express_validator_1.body)('relationship').equals('Other'))
        .notEmpty()
        .withMessage('Please specify other relationship')
        .isLength({ max: 50 })
        .withMessage('Other relationship cannot exceed 50 characters'),
    (0, express_validator_1.body)('guardianEmail')
        .optional()
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid guardian email address'),
    (0, express_validator_1.body)('guardianPhoneNo')
        .optional()
        .matches(/^(\+234|0)[789]\d{9}$/)
        .withMessage('Please provide a valid guardian phone number'),
    exports.handleValidationErrors
];
exports.validateAuditionInfo = [
    (0, express_validator_1.body)('auditionLocation')
        .isIn(['Lagos', 'Benin'])
        .withMessage('Audition location must be Lagos or Benin'),
    (0, express_validator_1.body)('auditionDate')
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
    (0, express_validator_1.body)('auditionTime')
        .custom((value) => {
        const format24h = /^([01]\d|2[0-3]):([0-5]\d)$/.test(value);
        const format12h = /^(1[0-2]|0?[1-9]):([0-5]\d)\s?(AM|PM)$/i.test(value);
        if (!format24h && !format12h) {
            throw new Error('Please provide a valid audition time (e.g., "9:29 AM" or "09:29")');
        }
        return true;
    }),
    (0, express_validator_1.body)('auditionRequirement')
        .optional()
        .isIn(['Microphone', 'Guitar', 'Bass', 'Drum', 'BackgroundMusic', 'StageLighting', 'Projector', 'Other'])
        .withMessage('Please select a valid audition requirement'),
    (0, express_validator_1.body)('audtionRequirement')
        .optional()
        .isIn(['Microphone', 'Guitar', 'Bass', 'Drum', 'BackgroundMusic', 'StageLighting', 'Projector', 'Other'])
        .withMessage('Please select a valid audition requirement'),
    (0, express_validator_1.body)('otherRequirement')
        .if((value, { req }) => {
        return req.body.auditionRequirement === 'Other' || req.body.audtionRequirement === 'Other';
    })
        .notEmpty()
        .withMessage('Please specify other requirement')
        .isLength({ max: 100 })
        .withMessage('Other requirement cannot exceed 100 characters'),
    (0, express_validator_1.body)('hasInstrument')
        .optional()
        .isIn(['Yes', 'No'])
        .withMessage('Has instrument must be Yes or No'),
    exports.handleValidationErrors
];
exports.validateTermsConditions = [
    (0, express_validator_1.body)('rulesAcceptance')
        .isBoolean()
        .custom((value) => {
        if (!value) {
            throw new Error('You must accept the competition rules');
        }
        return true;
    }),
    (0, express_validator_1.body)('promotionalAcceptance')
        .isBoolean()
        .custom((value) => {
        if (!value) {
            throw new Error('You must accept promotional terms');
        }
        return true;
    }),
    (0, express_validator_1.body)('contestantSignature')
        .isString()
        .notEmpty()
        .withMessage('Contestant signature is required')
        .custom((value) => {
        if (value && !value.startsWith('data:image/')) {
            throw new Error('Contestant signature must be a valid base64 image data URL');
        }
        return true;
    }),
    (0, express_validator_1.body)('guardianSignature')
        .optional()
        .custom((value, { req }) => {
        if (value && !value.startsWith('data:image/')) {
            throw new Error('Guardian signature must be a valid base64 image data URL');
        }
        return true;
    }),
    exports.handleValidationErrors
];
exports.validatePayment = [
    (0, express_validator_1.body)('amount')
        .isNumeric()
        .custom((value) => {
        if (value !== 1090) {
            throw new Error('Registration fee must be ₦1,090');
        }
        return true;
    }),
    (0, express_validator_1.body)('currency')
        .optional()
        .equals('NGN')
        .withMessage('Currency must be NGN'),
    exports.handleValidationErrors
];
exports.validateMediaInfo = [
    (0, express_validator_1.body)('profilePhoto')
        .optional()
        .isString()
        .withMessage('Profile photo must be a valid base64 string')
        .custom((value) => {
        if (value && !value.startsWith('data:image/')) {
            throw new Error('Profile photo must be a valid base64 image data URL');
        }
        return true;
    }),
    (0, express_validator_1.body)('videoUpload')
        .optional()
        .isString()
        .withMessage('Video upload must be a valid base64 string')
        .custom((value) => {
        if (value && !value.startsWith('data:video/')) {
            throw new Error('Video upload must be a valid base64 video data URL');
        }
        return true;
    }),
    exports.handleValidationErrors
];
exports.validateFileUpload = [
    (0, express_validator_1.body)('fileType')
        .isIn(['image', 'video'])
        .withMessage('File type must be image or video'),
    exports.handleValidationErrors
];
exports.validateRegistrationStatusUpdate = [
    (0, express_validator_1.body)('status')
        .isIn(['under_review', 'approved', 'rejected', 'qualified', 'disqualified'])
        .withMessage('Invalid status value'),
    (0, express_validator_1.body)('reviewNotes')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Review notes cannot exceed 500 characters'),
    exports.handleValidationErrors
];
exports.validateEvaluation = [
    (0, express_validator_1.body)('scores.talent')
        .isFloat({ min: 0, max: 10 })
        .withMessage('Talent score must be between 0 and 10'),
    (0, express_validator_1.body)('scores.presentation')
        .isFloat({ min: 0, max: 10 })
        .withMessage('Presentation score must be between 0 and 10'),
    (0, express_validator_1.body)('scores.creativity')
        .isFloat({ min: 0, max: 10 })
        .withMessage('Creativity score must be between 0 and 10'),
    (0, express_validator_1.body)('scores.overall')
        .isFloat({ min: 0, max: 10 })
        .withMessage('Overall score must be between 0 and 10'),
    (0, express_validator_1.body)('recommendation')
        .isIn(['advance', 'eliminate', 'callback'])
        .withMessage('Recommendation must be advance, eliminate, or callback'),
    (0, express_validator_1.body)('feedback.strengths')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Strengths feedback cannot exceed 500 characters'),
    (0, express_validator_1.body)('feedback.areasForImprovement')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Areas for improvement cannot exceed 500 characters'),
    (0, express_validator_1.body)('feedback.generalComments')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('General comments cannot exceed 1000 characters'),
    exports.handleValidationErrors
];
//# sourceMappingURL=validation.js.map