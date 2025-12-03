import mongoose, { Schema, Document } from 'mongoose';

export interface ITicketPurchase extends Document {
  purchaseReference: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  tickets: Array<{
    ticketId: mongoose.Types.ObjectId;
    ticketType: 'regular' | 'vip' | 'table_of_5' | 'table_of_10';
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  totalAmount: number;
  currency: string;
  paymentStatus: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
  paymentReference?: string;
  paymentTransactionId?: mongoose.Types.ObjectId;
  ticketNumbers: string[]; // Generated ticket numbers/QR codes
  ticketSent: boolean;
  ticketSentAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TicketPurchaseSchema = new Schema<ITicketPurchase>({
  purchaseReference: {
    type: String,
    unique: true,
    required: true,
    index: true
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  tickets: [{
    ticketId: {
      type: Schema.Types.ObjectId,
      ref: 'Ticket',
      required: true
    },
    ticketType: {
      type: String,
      enum: ['regular', 'vip', 'table_of_5', 'table_of_10'],
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0
    },
    totalPrice: {
      type: Number,
      required: true,
      min: 0
    }
  }],
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'NGN',
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentReference: {
    type: String,
    index: true
  },
  paymentTransactionId: {
    type: Schema.Types.ObjectId,
    ref: 'PaymentTransaction'
  },
  ticketNumbers: [{
    type: String
  }],
  ticketSent: {
    type: Boolean,
    default: false
  },
  ticketSentAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes
TicketPurchaseSchema.index({ email: 1 });
TicketPurchaseSchema.index({ purchaseReference: 1 });
TicketPurchaseSchema.index({ paymentReference: 1 });
TicketPurchaseSchema.index({ paymentStatus: 1 });
TicketPurchaseSchema.index({ createdAt: -1 });

export default mongoose.model<ITicketPurchase>('TicketPurchase', TicketPurchaseSchema);

