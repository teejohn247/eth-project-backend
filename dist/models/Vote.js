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
const VoteSchema = new mongoose_1.Schema({
    contestantId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Contestant',
        required: true,
        index: true
    },
    contestantEmail: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
        index: true
    },
    numberOfVotes: {
        type: Number,
        required: true,
        min: 1
    },
    amountPaid: {
        type: Number,
        required: true,
        min: 0
    },
    currency: {
        type: String,
        default: 'NGN',
        required: true
    },
    voterInfo: {
        firstName: String,
        lastName: String,
        email: String,
        phone: String
    },
    paymentReference: {
        type: String,
        index: true
    },
    paymentTransactionId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'PaymentTransaction'
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'failed', 'refunded'],
        default: 'pending'
    },
    paymentMethod: String,
    notes: String
}, {
    timestamps: true
});
VoteSchema.index({ contestantId: 1, createdAt: -1 });
VoteSchema.index({ contestantEmail: 1 });
VoteSchema.index({ paymentReference: 1 });
VoteSchema.index({ paymentStatus: 1 });
exports.default = mongoose_1.default.model('Vote', VoteSchema);
//# sourceMappingURL=Vote.js.map