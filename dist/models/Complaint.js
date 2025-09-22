"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const ComplaintSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    complaintType: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    status: {
        type: String,
        enum: ['Pending', 'In Progress', 'Resolved', 'Closed'],
        default: 'Pending'
    },
    resolvedAt: {
        type: Date
    }
}, {
    timestamps: true
});
ComplaintSchema.index({ userId: 1, createdAt: -1 });
ComplaintSchema.index({ status: 1 });
exports.default = (0, mongoose_1.model)('Complaint', ComplaintSchema);
//# sourceMappingURL=Complaint.js.map