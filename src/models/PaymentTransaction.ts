import mongoose, { Schema, Document } from 'mongoose';

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

const PaymentTransactionSchema = new Schema<IPaymentTransaction>({
  registrationId: { type: Schema.Types.ObjectId, ref: 'Registration', required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
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
  gatewayResponse: Schema.Types.Mixed,
  failureReason: String,
  processedAt: Date
}, {
  timestamps: true
});

// Indexes
PaymentTransactionSchema.index({ reference: 1 });
PaymentTransactionSchema.index({ registrationId: 1 });
PaymentTransactionSchema.index({ userId: 1 });
PaymentTransactionSchema.index({ status: 1 });
PaymentTransactionSchema.index({ createdAt: -1 });

export default mongoose.model<IPaymentTransaction>('PaymentTransaction', PaymentTransactionSchema);
