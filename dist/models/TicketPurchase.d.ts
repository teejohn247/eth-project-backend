import mongoose, { Document } from 'mongoose';
export interface ITicketPurchase extends Document {
    purchaseReference: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    tickets: Array<{
        ticketId: mongoose.Types.ObjectId;
        ticketType: 'regular' | 'vip' | 'vvip';
        quantity: number;
        unitPrice: number;
        totalPrice: number;
    }>;
    totalAmount: number;
    currency: string;
    paymentStatus: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
    paymentReference?: string;
    paymentTransactionId?: mongoose.Types.ObjectId;
    ticketNumbers: string[];
    ticketSent: boolean;
    ticketSentAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<ITicketPurchase, {}, {}, {}, mongoose.Document<unknown, {}, ITicketPurchase> & ITicketPurchase & {
    _id: mongoose.Types.ObjectId;
}, any>;
export default _default;
//# sourceMappingURL=TicketPurchase.d.ts.map