"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const RegistrationSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    registrationNumber: { type: String, unique: true },
    registrationType: { type: String, enum: ['individual', 'group'], required: true },
    personalInfo: {
        firstName: { type: String, required: true },
        lastName: { type: String, required: true },
        email: { type: String, required: true },
        phoneNo: { type: String, required: true },
        dateOfBirth: { type: Date, required: true },
        age: Number,
        placeOfBirth: String,
        gender: { type: String, enum: ['Male', 'Female'], required: true },
        maritalStatus: { type: String, enum: ['Single', 'Married'] },
        address: String,
        state: String,
        lga: String,
        nationality: String,
        tshirtSize: { type: String, enum: ['XS', 'S', 'M', 'L', 'XL', 'XXL'], required: true }
    },
    talentInfo: {
        talentCategory: {
            type: String,
            enum: ['Singing', 'Dancing', 'Acting', 'Comedy', 'Drama', 'Instrumental', 'Other'],
            required: true
        },
        otherTalentCategory: String,
        skillLevel: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'], required: true },
        stageName: String,
        previouslyParticipated: { type: String, enum: ['Yes', 'No'] },
        previousParticipation: {
            previousParticipationCategory: { type: String, enum: ['Singing', 'Dancing', 'Acting', 'Comedy', 'Drama', 'Instrumental', 'Other'] },
            previousParticipationOtherCategory: String,
            competitionName: String,
            participationPosition: String
        }
    },
    groupInfo: {
        groupName: String,
        noOfGroupMembers: { type: Number, min: 2, max: 5 },
        members: [{
                firstName: { type: String, required: true },
                lastName: { type: String, required: true },
                dateOfBirth: { type: Date, required: true },
                gender: { type: String, enum: ['Male', 'Female'], required: true },
                tshirtSize: { type: String, enum: ['XS', 'S', 'M', 'L', 'XL', 'XXL'], required: true }
            }]
    },
    guardianInfo: {
        title: { type: String, enum: ['Mr', 'Mrs', 'Miss'] },
        guardianName: String,
        relationship: { type: String, enum: ['Father', 'Mother', 'Aunt', 'Uncle', 'Brother', 'Sister', 'Other'] },
        otherRelationship: String,
        guardianEmail: String,
        guardianPhoneNo: String,
        guardianAddress: String,
        guardianState: String
    },
    mediaInfo: {
        profilePhoto: {
            originalName: String,
            filename: String,
            path: String,
            size: Number,
            mimetype: String
        },
        videoUpload: {
            originalName: String,
            filename: String,
            path: String,
            size: Number,
            mimetype: String,
            duration: Number
        }
    },
    auditionInfo: {
        auditionLocation: { type: String, enum: ['Lagos', 'Benin'], required: true },
        auditionDate: { type: Date, required: true },
        auditionTime: { type: String, required: true },
        auditionRequirement: {
            type: String,
            enum: ['Microphone', 'Guitar', 'Bass', 'Drum', 'BackgroundMusic', 'StageLighting', 'Projector', 'Other']
        },
        otherRequirement: String,
        hasInstrument: { type: String, enum: ['Yes', 'No'] }
    },
    termsConditions: {
        rulesAcceptance: { type: Boolean, required: true },
        promotionalAcceptance: { type: Boolean, required: true },
        contestantSignature: String,
        guardianSignature: String,
        signedAt: { type: Date, default: Date.now }
    },
    paymentInfo: {
        amount: { type: Number, required: true, default: 1090 },
        currency: { type: String, default: 'NGN' },
        paymentStatus: {
            type: String,
            enum: ['pending', 'processing', 'completed', 'failed', 'refunded'],
            default: 'pending'
        },
        paymentReference: String,
        transactionId: String,
        paymentMethod: String,
        paidAt: Date,
        paymentResponse: mongoose_1.Schema.Types.Mixed
    },
    status: {
        type: String,
        enum: ['draft', 'submitted', 'under_review', 'approved', 'rejected', 'qualified', 'disqualified'],
        default: 'draft'
    },
    currentStep: { type: Number, default: 0 },
    completedSteps: [Number],
    submittedAt: Date,
    reviewedAt: Date,
    reviewedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    reviewNotes: String
}, {
    timestamps: true
});
RegistrationSchema.pre('save', async function (next) {
    if (this.isNew && !this.registrationNumber) {
        const count = await mongoose_1.default.model('Registration').countDocuments();
        this.registrationNumber = `ETH2024${String(count + 1).padStart(3, '0')}`;
    }
    if (this.personalInfo.dateOfBirth) {
        const today = new Date();
        const birthDate = new Date(this.personalInfo.dateOfBirth);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        this.personalInfo.age = age;
    }
    next();
});
RegistrationSchema.index({ userId: 1 });
RegistrationSchema.index({ registrationNumber: 1 });
RegistrationSchema.index({ status: 1 });
RegistrationSchema.index({ 'paymentInfo.paymentStatus': 1 });
RegistrationSchema.index({ createdAt: -1 });
exports.default = mongoose_1.default.model('Registration', RegistrationSchema);
//# sourceMappingURL=Registration.js.map