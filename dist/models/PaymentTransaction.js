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
const PaymentTransactionSchema = new mongoose_1.Schema({
    registrationId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Registration', required: true },
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    reference: { type: String, unique: true, required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'NGN' },
    status: {
        type: String,
        enum: ['initiated', 'pending', 'successful', 'failed', 'cancelled', 'refunded'],
        default: 'initiated'
    },
    paymentMethod: String,
    gatewayReference: String,
    gatewayResponse: mongoose_1.Schema.Types.Mixed,
    failureReason: String,
    processedAt: Date
}, {
    timestamps: true
});
PaymentTransactionSchema.index({ reference: 1 });
PaymentTransactionSchema.index({ registrationId: 1 });
PaymentTransactionSchema.index({ userId: 1 });
PaymentTransactionSchema.index({ status: 1 });
PaymentTransactionSchema.index({ createdAt: -1 });
exports.default = mongoose_1.default.model('PaymentTransaction', PaymentTransactionSchema);
//# sourceMappingURL=PaymentTransaction.js.map