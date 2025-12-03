import mongoose, { Document } from 'mongoose';
export interface IVote extends Document {
    contestantId: mongoose.Types.ObjectId;
    contestantEmail: string;
    numberOfVotes: number;
    amountPaid: number;
    currency: string;
    voterInfo?: {
        firstName?: string;
        lastName?: string;
        email?: string;
        phone?: string;
    };
    paymentReference?: string;
    paymentTransactionId?: mongoose.Types.ObjectId;
    paymentStatus: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
    paymentMethod?: string;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<IVote, {}, {}, {}, mongoose.Document<unknown, {}, IVote> & IVote & {
    _id: mongoose.Types.ObjectId;
}, any>;
export default _default;
//# sourceMappingURL=Vote.d.ts.map