import mongoose, { Schema, Document } from 'mongoose';

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

const TicketSchema = new Schema<ITicket>({
  ticketType: {
    type: String,
    enum: ['regular', 'vip', 'vvip'],
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'NGN',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  availableQuantity: {
    type: Number,
    min: 0
  },
  soldQuantity: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true
});

// Indexes
TicketSchema.index({ ticketType: 1 });
TicketSchema.index({ isActive: 1 });

export default mongoose.model<ITicket>('Ticket', TicketSchema);

