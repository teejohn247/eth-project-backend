import mongoose, { Document } from 'mongoose';
export interface IPaymentTransaction extends Document {
    registrationId: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    reference: string;
    amount: number;
    currency: string;
    status: 'initiated' | 'pending' | 'successful' | 'failed' | 'cancelled' | 'refunded';
    paymentMethod?: string;
    gatewayReference?: string;
    gatewayResponse?: any;
    failureReason?: string;
    processedAt?: Date;
    createdAt: Date;
}
declare const _default: mongoose.Model<IPaymentTransaction, {}, {}, {}, mongoose.Document<unknown, {}, IPaymentTransaction> & IPaymentTransaction & {
    _id: mongoose.Types.ObjectId;
}, any>;
export default _default;
//# sourceMappingURL=PaymentTransaction.d.ts.map