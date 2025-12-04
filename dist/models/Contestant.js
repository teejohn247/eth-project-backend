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
const ContestantSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    registrationId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Registration',
        required: true,
        unique: true,
        index: true
    },
    contestantNumber: {
        type: String,
        unique: true,
        required: true,
        index: true
    },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    phoneNo: { type: String, required: true, trim: true },
    dateOfBirth: Date,
    age: Number,
    gender: { type: String, enum: ['Male', 'Female'] },
    state: String,
    lga: String,
    talentCategory: {
        type: String,
        enum: ['Singing', 'Dancing', 'Acting', 'Comedy', 'Drama', 'Instrumental', 'Other']
    },
    stageName: String,
    skillLevel: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'] },
    profilePhoto: {
        url: String,
        publicId: String
    },
    videoUpload: {
        url: String,
        publicId: String,
        thumbnailUrl: String
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'eliminated', 'winner'],
        default: 'active'
    },
    isQualified: {
        type: Boolean,
        default: false
    },
    qualifiedAt: Date,
    totalVotes: {
        type: Number,
        default: 0,
        min: 0
    },
    totalVoteAmount: {
        type: Number,
        default: 0,
        min: 0
    },
    registrationNumber: { type: String, required: true },
    registrationType: {
        type: String,
        enum: ['individual', 'group', 'bulk'],
        required: true
    }
}, {
    timestamps: true
});
ContestantSchema.index({ contestantNumber: 1 });
ContestantSchema.index({ email: 1 });
ContestantSchema.index({ status: 1 });
ContestantSchema.index({ totalVotes: -1 });
ContestantSchema.index({ talentCategory: 1 });
ContestantSchema.pre('save', async function (next) {
    if (this.isNew && !this.contestantNumber) {
        const ContestantModel = mongoose_1.default.model('Contestant');
        const lastContestant = await ContestantModel.findOne({ contestantNumber: { $regex: /^CNT-\d+$/ } }, {}, { sort: { contestantNumber: -1 } }).lean();
        let nextNumber = 1;
        if (lastContestant && lastContestant.contestantNumber) {
            const match = lastContestant.contestantNumber.match(/CNT-(\d+)/);
            if (match) {
                nextNumber = parseInt(match[1], 10) + 1;
            }
        }
        this.contestantNumber = `CNT-${nextNumber.toString().padStart(3, '0')}`;
    }
    next();
});
exports.default = mongoose_1.default.model('Contestant', ContestantSchema);
//# sourceMappingURL=Contestant.js.map