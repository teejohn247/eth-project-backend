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
const OTPSchema = new mongoose_1.Schema({
    email: {
        type: String,
        required: [true, 'Email is required'],
        lowercase: true,
        trim: true,
        match: [
            /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
            'Please enter a valid email address'
        ]
    },
    otp: {
        type: String,
        required: [true, 'OTP is required'],
        length: [4, 'OTP must be exactly 4 digits']
    },
    type: {
        type: String,
        required: [true, 'OTP type is required'],
        enum: ['email_verification', 'password_reset']
    },
    expiresAt: {
        type: Date,
        required: [true, 'Expiry date is required'],
        index: { expireAfterSeconds: 0 }
    },
    isUsed: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});
OTPSchema.index({ email: 1, type: 1, isUsed: 1 });
OTPSchema.index({ email: 1, otp: 1, type: 1 });
OTPSchema.statics.generateOTP = function () {
    return Math.floor(1000 + Math.random() * 9000).toString();
};
OTPSchema.statics.createOTP = async function (email, type, expiryMinutes = 10) {
    await this.updateMany({ email, type, isUsed: false }, { isUsed: true });
    const generateOTP = () => {
        return Math.floor(1000 + Math.random() * 9000).toString();
    };
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);
    const otpDoc = new this({
        email,
        otp,
        type,
        expiresAt,
        isUsed: false
    });
    await otpDoc.save();
    return otpDoc;
};
OTPSchema.statics.verifyOTP = async function (email, otp, type) {
    const otpDoc = await this.findOne({
        email,
        otp,
        type,
        isUsed: false,
        expiresAt: { $gt: new Date() }
    });
    if (!otpDoc) {
        return { valid: false, message: 'Invalid or expired OTP' };
    }
    otpDoc.isUsed = true;
    await otpDoc.save();
    return { valid: true, message: 'OTP verified successfully' };
};
exports.default = mongoose_1.default.model('OTP', OTPSchema);
//# sourceMappingURL=OTP.js.map