import mongoose, { Schema, Document } from 'mongoose';

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

const VoteSchema = new Schema<IVote>({
  contestantId: {
    type: Schema.Types.ObjectId,
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
    type: Schema.Types.ObjectId,
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

// Indexes
VoteSchema.index({ contestantId: 1, createdAt: -1 });
VoteSchema.index({ contestantEmail: 1 });
VoteSchema.index({ paymentReference: 1 });
VoteSchema.index({ paymentStatus: 1 });

export default mongoose.model<IVote>('Vote', VoteSchema);

