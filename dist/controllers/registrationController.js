"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteRegistration = exports.getRegistrationStatus = exports.updateTermsConditions = exports.updateAuditionInfo = exports.updateMediaInfo = exports.updateGuardianInfo = exports.updateGroupInfo = exports.updateTalentInfo = exports.updatePersonalInfo = exports.submitRegistration = exports.updateRegistration = exports.getRegistration = exports.createRegistration = exports.getUserRegistrations = void 0;
const Registration_1 = __importDefault(require("../models/Registration"));
const AuditionSchedule_1 = __importDefault(require("../models/AuditionSchedule"));
const mongoose_1 = __importDefault(require("mongoose"));
const cloudinaryService_1 = __importDefault(require("../services/cloudinaryService"));
const findRegistrationByIdOrUserId = async (idParam, userId) => {
    const isValidObjectId = mongoose_1.default.Types.ObjectId.isValid(idParam);
    let registration;
    if (isValidObjectId) {
        registration = await Registration_1.default.findOne({
            _id: idParam,
            userId: userId
        });
    }
    if (!registration) {
        if (mongoose_1.default.Types.ObjectId.isValid(idParam)) {
            registration = await Registration_1.default.findOne({
                userId: idParam
            });
            if (registration && registration.userId.toString() !== userId && idParam !== userId) {
                return null;
            }
        }
        else {
            registration = await Registration_1.default.findOne({
                userId: userId
            });
        }
    }
    return registration;
};
const getUserRegistrations = async (req, res) => {
    try {
        const registrations = await Registration_1.default.find({ userId: req.user?.userId })
            .sort({ createdAt: -1 })
            .select('-paymentInfo.paymentResponse');
        res.status(200).json({
            success: true,
            message: 'Registrations retrieved successfully',
            data: registrations
        });
    }
    catch (error) {
        console.error('Get registrations error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve registrations',
            error: process.env.NODE_ENV === 'development' ? error : undefined
        });
    }
};
exports.getUserRegistrations = getUserRegistrations;
const createRegistration = async (req, res) => {
    try {
        const { registrationType } = req.body;
        const existingRegistration = await Registration_1.default.findOne({
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
        const registration = new Registration_1.default({
            userId: req.user?.userId,
            registrationType
        });
        await registration.save();
        res.status(201).json({
            success: true,
            message: 'Registration created successfully',
            data: registration
        });
    }
    catch (error) {
        console.error('Create registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create registration',
            error: process.env.NODE_ENV === 'development' ? error : undefined
        });
    }
};
exports.createRegistration = createRegistration;
const getRegistration = async (req, res) => {
    try {
        const { id } = req.params;
        const registration = await findRegistrationByIdOrUserId(id, req.user?.userId);
        if (!registration) {
            res.status(404).json({
                success: false,
                message: 'Registration not found'
            });
            return;
        }
        const registrationData = registration.toObject();
        if (registrationData.paymentInfo?.paymentResponse) {
            delete registrationData.paymentInfo.paymentResponse;
        }
        res.status(200).json({
            success: true,
            message: 'Registration retrieved successfully',
            data: registrationData
        });
    }
    catch (error) {
        console.error('Get registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve registration',
            error: process.env.NODE_ENV === 'development' ? error : undefined
        });
    }
};
exports.getRegistration = getRegistration;
const updateRegistration = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        const registration = await findRegistrationByIdOrUserId(id, req.user?.userId);
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
                message: 'Cannot update a submitted registration'
            });
            return;
        }
        Object.assign(registration, updateData);
        await registration.save();
        res.status(200).json({
            success: true,
            message: 'Registration updated successfully',
            data: registration
        });
    }
    catch (error) {
        console.error('Update registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update registration',
            error: process.env.NODE_ENV === 'development' ? error : undefined
        });
    }
};
exports.updateRegistration = updateRegistration;
const submitRegistration = async (req, res) => {
    try {
        const { id } = req.params;
        const registration = await findRegistrationByIdOrUserId(id, req.user?.userId);
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
        const requiredSteps = registration.registrationType === 'individual' ?
            [1, 2, 4, 5, 6] :
            [1, 2, 3, 5, 6];
        const missingSteps = requiredSteps.filter(step => !registration.completedSteps.includes(step));
        if (missingSteps.length > 0) {
            res.status(400).json({
                success: false,
                message: 'Please complete all required steps before submission',
                missingSteps
            });
            return;
        }
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
    }
    catch (error) {
        console.error('Submit registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to submit registration',
            error: process.env.NODE_ENV === 'development' ? error : undefined
        });
    }
};
exports.submitRegistration = submitRegistration;
const updatePersonalInfo = async (req, res) => {
    try {
        const { id } = req.params;
        const { nextStep, ...personalInfo } = req.body;
        const foundRegistration = await findRegistrationByIdOrUserId(id, req.user?.userId);
        if (!foundRegistration) {
            res.status(404).json({
                success: false,
                message: 'Registration not found'
            });
            return;
        }
        const currentStepToSet = nextStep || 1;
        const registration = await Registration_1.default.findOneAndUpdate({ _id: foundRegistration._id, userId: req.user?.userId }, {
            personalInfo,
            $addToSet: { completedSteps: 1 },
            currentStep: currentStepToSet
        }, { new: true });
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
    }
    catch (error) {
        console.error('Update personal info error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update personal information',
            error: process.env.NODE_ENV === 'development' ? error : undefined
        });
    }
};
exports.updatePersonalInfo = updatePersonalInfo;
const updateTalentInfo = async (req, res) => {
    try {
        const { id } = req.params;
        const { nextStep, ...talentInfo } = req.body;
        const foundRegistration = await findRegistrationByIdOrUserId(id, req.user?.userId);
        if (!foundRegistration) {
            res.status(404).json({
                success: false,
                message: 'Registration not found'
            });
            return;
        }
        const currentStepToSet = nextStep || 2;
        const registration = await Registration_1.default.findOneAndUpdate({ _id: foundRegistration._id, userId: req.user?.userId }, {
            talentInfo,
            $addToSet: { completedSteps: 2 },
            currentStep: currentStepToSet
        }, { new: true });
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
    }
    catch (error) {
        console.error('Update talent info error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update talent information',
            error: process.env.NODE_ENV === 'development' ? error : undefined
        });
    }
};
exports.updateTalentInfo = updateTalentInfo;
const updateGroupInfo = async (req, res) => {
    try {
        const { id } = req.params;
        const { nextStep, ...bodyData } = req.body;
        let groupInfo = bodyData;
        if (groupInfo.members && Array.isArray(groupInfo.members)) {
            groupInfo.members = groupInfo.members.map((member) => ({
                ...member,
                tshirtSize: member.tshirtSize ? member.tshirtSize.toUpperCase() : member.tshirtSize
            }));
        }
        if (groupInfo.noOfGroupMembers && typeof groupInfo.noOfGroupMembers === 'string') {
            groupInfo.noOfGroupMembers = parseInt(groupInfo.noOfGroupMembers, 10);
        }
        const foundRegistration = await findRegistrationByIdOrUserId(id, req.user?.userId);
        if (!foundRegistration) {
            res.status(404).json({
                success: false,
                message: 'Registration not found'
            });
            return;
        }
        const currentStepToSet = nextStep || 3;
        const registration = await Registration_1.default.findOneAndUpdate({ _id: foundRegistration._id, userId: req.user?.userId }, {
            groupInfo,
            $addToSet: { completedSteps: 3 },
            currentStep: currentStepToSet
        }, { new: true });
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
    }
    catch (error) {
        console.error('Update group info error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update group information',
            error: process.env.NODE_ENV === 'development' ? error : undefined
        });
    }
};
exports.updateGroupInfo = updateGroupInfo;
const updateGuardianInfo = async (req, res) => {
    try {
        const { id } = req.params;
        const { nextStep, ...guardianInfo } = req.body;
        const foundRegistration = await findRegistrationByIdOrUserId(id, req.user?.userId);
        if (!foundRegistration) {
            res.status(404).json({
                success: false,
                message: 'Registration not found'
            });
            return;
        }
        const registration = await Registration_1.default.findOneAndUpdate({ _id: foundRegistration._id, userId: req.user?.userId }, {
            guardianInfo,
            $addToSet: { completedSteps: 4 },
            currentStep: nextStep || 4
        }, { new: true });
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
    }
    catch (error) {
        console.error('Update guardian info error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update guardian information',
            error: process.env.NODE_ENV === 'development' ? error : undefined
        });
    }
};
exports.updateGuardianInfo = updateGuardianInfo;
const updateMediaInfo = async (req, res) => {
    try {
        const { id } = req.params;
        const { nextStep } = req.body;
        const files = req.files;
        const foundRegistration = await findRegistrationByIdOrUserId(id, req.user?.userId);
        if (!foundRegistration) {
            res.status(404).json({
                success: false,
                message: 'Registration not found'
            });
            return;
        }
        const mediaInfo = {};
        if (files?.profilePhoto && files.profilePhoto[0]) {
            try {
                const photoFile = files.profilePhoto[0];
                const photoPublicId = `user_${req.user?.userId}_profile_${Date.now()}`;
                const photoResult = await cloudinaryService_1.default.uploadImage(photoFile.buffer, photoPublicId);
                mediaInfo.profilePhoto = {
                    url: photoResult.url,
                    publicId: photoResult.publicId,
                    format: photoResult.format,
                    width: photoResult.width,
                    height: photoResult.height,
                    bytes: photoResult.bytes
                };
            }
            catch (error) {
                console.error('Profile photo upload error:', error);
                res.status(400).json({
                    success: false,
                    message: 'Failed to upload profile photo',
                    error: process.env.NODE_ENV === 'development' ? error : undefined
                });
                return;
            }
        }
        if (files?.videoUpload && files.videoUpload[0]) {
            try {
                const videoFile = files.videoUpload[0];
                if (videoFile.size > 100 * 1024 * 1024) {
                    res.status(400).json({
                        success: false,
                        message: 'Video file is too large. Maximum size is 100MB.',
                        error: process.env.NODE_ENV === 'development' ? `File size: ${Math.round(videoFile.size / 1024 / 1024)}MB` : undefined
                    });
                    return;
                }
                const videoPublicId = `user_${req.user?.userId}_video_${Date.now()}`;
                const videoResult = await cloudinaryService_1.default.uploadVideo(videoFile.buffer, videoPublicId);
                const thumbnailUrl = cloudinaryService_1.default.generateVideoThumbnail(videoResult.publicId);
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
            }
            catch (error) {
                console.error('Video upload error:', error);
                let errorMessage = 'Failed to upload video';
                if (error.message.includes('Invalid video data format')) {
                    errorMessage = 'Invalid video format. Please upload a valid video file (MP4, MOV, AVI, etc.)';
                }
                else if (error.message.includes('too large')) {
                    errorMessage = 'Video file is too large. Please use a smaller file (max 100MB)';
                }
                else if (error.message.includes('rate limit')) {
                    errorMessage = 'Upload rate limit exceeded. Please try again in a few minutes';
                }
                else if (error.message.includes('Invalid video format or corrupted file')) {
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
        const registration = await Registration_1.default.findOneAndUpdate({ _id: foundRegistration._id, userId: req.user?.userId }, {
            $set: {
                'mediaInfo.profilePhoto': mediaInfo.profilePhoto || foundRegistration.mediaInfo?.profilePhoto,
                'mediaInfo.videoUpload': mediaInfo.videoUpload || foundRegistration.mediaInfo?.videoUpload
            },
            $addToSet: { completedSteps: 5 },
            currentStep: nextStep || 5
        }, { new: true });
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
    }
    catch (error) {
        console.error('Update media info error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update media information',
            error: process.env.NODE_ENV === 'development' ? error : undefined
        });
    }
};
exports.updateMediaInfo = updateMediaInfo;
const updateAuditionInfo = async (req, res) => {
    try {
        const { id } = req.params;
        const { nextStep, ...bodyData } = req.body;
        let auditionInfo = bodyData;
        if (auditionInfo.audtionRequirement && !auditionInfo.auditionRequirement) {
            auditionInfo.auditionRequirement = auditionInfo.audtionRequirement;
            delete auditionInfo.audtionRequirement;
        }
        const schedule = await AuditionSchedule_1.default.findOne({
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
        const foundRegistration = await findRegistrationByIdOrUserId(id, req.user?.userId);
        if (!foundRegistration) {
            res.status(404).json({
                success: false,
                message: 'Registration not found'
            });
            return;
        }
        const registration = await Registration_1.default.findOneAndUpdate({ _id: foundRegistration._id, userId: req.user?.userId }, {
            auditionInfo,
            $addToSet: { completedSteps: 6 },
            currentStep: nextStep || 6
        }, { new: true });
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
    }
    catch (error) {
        console.error('Update audition info error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update audition information',
            error: process.env.NODE_ENV === 'development' ? error : undefined
        });
    }
};
exports.updateAuditionInfo = updateAuditionInfo;
const updateTermsConditions = async (req, res) => {
    try {
        const { id } = req.params;
        const { nextStep, ...termsConditions } = req.body;
        const foundRegistration = await findRegistrationByIdOrUserId(id, req.user?.userId);
        if (!foundRegistration) {
            res.status(404).json({
                success: false,
                message: 'Registration not found'
            });
            return;
        }
        const registration = await Registration_1.default.findOneAndUpdate({ _id: foundRegistration._id, userId: req.user?.userId }, {
            termsConditions: {
                ...termsConditions,
                signedAt: new Date()
            },
            $addToSet: { completedSteps: 7 },
            currentStep: nextStep || 7
        }, { new: true });
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
    }
    catch (error) {
        console.error('Update terms conditions error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update terms and conditions',
            error: process.env.NODE_ENV === 'development' ? error : undefined
        });
    }
};
exports.updateTermsConditions = updateTermsConditions;
const getRegistrationStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const registration = await Registration_1.default.findOne({
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
    }
    catch (error) {
        console.error('Get registration status error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve registration status',
            error: process.env.NODE_ENV === 'development' ? error : undefined
        });
    }
};
exports.getRegistrationStatus = getRegistrationStatus;
const deleteRegistration = async (req, res) => {
    try {
        const { id } = req.params;
        const registration = await findRegistrationByIdOrUserId(id, req.user?.userId);
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
        await Registration_1.default.findByIdAndDelete(id);
        res.status(200).json({
            success: true,
            message: 'Registration deleted successfully'
        });
    }
    catch (error) {
        console.error('Delete registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete registration',
            error: process.env.NODE_ENV === 'development' ? error : undefined
        });
    }
};
exports.deleteRegistration = deleteRegistration;
//# sourceMappingURL=registrationController.js.map