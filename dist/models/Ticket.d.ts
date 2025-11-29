import mongoose, { Document } from 'mongoose';
export interface ITicket extends Document {
    ticketType: 'regular' | 'vip' | 'vvip';
    name: string;
    description?: string;
    price: number;
    currency: string;
    isActive: boolean;
    availableQuantity?: number;
    soldQuantity: number;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<ITicket, {}, {}, {}, mongoose.Document<unknown, {}, ITicket> & ITicket & {
    _id: mongoose.Types.ObjectId;
}, any>;
export default _default;
//# sourceMappingURL=Ticket.d.ts.map