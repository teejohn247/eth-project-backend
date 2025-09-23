import mongoose, { Document } from 'mongoose';
export interface IBulkRegistration extends Document {
    ownerId: mongoose.Types.ObjectId;
    bulkRegistrationNumber: string;
    totalSlots: number;
    usedSlots: number;
    availableSlots: number;
    pricePerSlot: number;
    totalAmount: number;
    currency: string;
    paymentInfo: {
        paymentStatus: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
        paymentReference?: string;
        transactionId?: string;
        paymentMethod?: string;
        paidAt?: Date;
        paymentResponse?: any;
    };
    participants: Array<{
        participantId?: mongoose.Types.ObjectId;
        registrationId?: mongoose.Types.ObjectId;
        firstName: string;
        lastName: string;
        email: string;
        phoneNo?: string;
        invitationStatus: 'pending' | 'sent' | 'accepted' | 'registered' | 'completed';
        invitationSentAt?: Date;
        registeredAt?: Date;
        otpToken?: string;
        otpExpiresAt?: Date;
        addedAt: Date;
        paidBy: {
            userId: mongoose.Types.ObjectId;
            firstName: string;
            lastName: string;
            email: string;
            registrationNumber: string;
        };
    }>;
    status: 'draft' | 'payment_pending' | 'active' | 'completed' | 'expired';
    expiresAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<IBulkRegistration, {}, {}, {}, mongoose.Document<unknown, {}, IBulkRegistration> & IBulkRegistration & {
    _id: mongoose.Types.ObjectId;
}, any>;
export default _default;
//# sourceMappingURL=BulkRegistration.d.ts.map