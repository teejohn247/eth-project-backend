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
const BulkRegistrationSchema = new mongoose_1.Schema({
    ownerId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    bulkRegistrationNumber: { type: String, unique: true },
    totalSlots: { type: Number, required: true, min: 2, max: 50 },
    usedSlots: { type: Number, default: 0 },
    availableSlots: { type: Number },
    pricePerSlot: { type: Number, required: true },
    totalAmount: { type: Number, required: true },
    currency: { type: String, default: 'NGN' },
    paymentInfo: {
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
    participants: [{
            participantId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
            registrationId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Registration' },
            firstName: { type: String, required: true },
            lastName: { type: String, required: true },
            email: { type: String, required: true },
            phoneNo: String,
            invitationStatus: {
                type: String,
                enum: ['pending', 'sent', 'accepted', 'registered', 'completed'],
                default: 'pending'
            },
            invitationSentAt: Date,
            registeredAt: Date,
            otpToken: String,
            otpExpiresAt: Date,
            addedAt: { type: Date, default: Date.now },
            paidBy: {
                userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
                firstName: { type: String, required: true },
                lastName: { type: String, required: true },
                email: { type: String, required: true },
                registrationNumber: { type: String, required: true }
            }
        }],
    status: {
        type: String,
        enum: ['draft', 'payment_pending', 'active', 'completed', 'expired'],
        default: 'draft'
    },
    expiresAt: Date
}, {
    timestamps: true
});
BulkRegistrationSchema.pre('save', async function (next) {
    if (this.isNew && !this.bulkRegistrationNumber) {
        const timestamp = Date.now().toString().slice(-6);
        const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
        this.bulkRegistrationNumber = `BULK-ETH2024${timestamp}${random}`;
    }
    this.availableSlots = this.totalSlots - this.usedSlots;
    next();
});
BulkRegistrationSchema.index({ ownerId: 1, status: 1 });
BulkRegistrationSchema.index({ 'participants.email': 1 });
BulkRegistrationSchema.index({ bulkRegistrationNumber: 1 });
exports.default = mongoose_1.default.model('BulkRegistration', BulkRegistrationSchema);
//# sourceMappingURL=BulkRegistration.js.map