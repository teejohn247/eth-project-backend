import mongoose, { Schema, Document } from 'mongoose';

export interface IBulkRegistration extends Document {
  ownerId: mongoose.Types.ObjectId; // User who purchased the bulk slots
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
    participantId?: mongoose.Types.ObjectId; // Reference to User model when they complete registration
    registrationId?: mongoose.Types.ObjectId; // Reference to Registration model
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
  }>;
  
  status: 'draft' | 'payment_pending' | 'active' | 'completed' | 'expired';
  expiresAt?: Date; // Optional expiration date for the bulk registration
  createdAt: Date;
  updatedAt: Date;
}

const BulkRegistrationSchema = new Schema<IBulkRegistration>({
  ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  bulkRegistrationNumber: { type: String, unique: true },
  totalSlots: { type: Number, required: true, min: 2, max: 50 },
  usedSlots: { type: Number, default: 0 },
  availableSlots: { type: Number },
  pricePerSlot: { type: Number, required: true },
  totalAmount: { type: Number, required: true },
  currency: { type: String, default: 'NGN' },
  
  paymentInfo: {
    paymentStatus: { 
      type: String, 
      enum: ['pending', 'processing', 'completed', 'failed', 'refunded'], 
      default: 'pending' 
    },
    paymentReference: String,
    transactionId: String,
    paymentMethod: String,
    paidAt: Date,
    paymentResponse: Schema.Types.Mixed
  },
  
  participants: [{
    participantId: { type: Schema.Types.ObjectId, ref: 'User' },
    registrationId: { type: Schema.Types.ObjectId, ref: 'Registration' },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    phoneNo: String,
    invitationStatus: { 
      type: String, 
      enum: ['pending', 'sent', 'accepted', 'registered', 'completed'], 
      default: 'pending' 
    },
    invitationSentAt: Date,
    registeredAt: Date,
    otpToken: String,
    otpExpiresAt: Date,
    addedAt: { type: Date, default: Date.now }
  }],
  
  status: { 
    type: String, 
    enum: ['draft', 'payment_pending', 'active', 'completed', 'expired'], 
    default: 'draft' 
  },
  expiresAt: Date
}, {
  timestamps: true
});

// Pre-save middleware to generate bulk registration number and calculate available slots
BulkRegistrationSchema.pre('save', async function(next) {
  if (this.isNew && !this.bulkRegistrationNumber) {
    // Generate unique bulk registration number
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
    this.bulkRegistrationNumber = `BULK-ETH2024${timestamp}${random}`;
  }
  
  // Calculate available slots
  this.availableSlots = this.totalSlots - this.usedSlots;
  
  next();
});

// Index for efficient querying
BulkRegistrationSchema.index({ ownerId: 1, status: 1 });
BulkRegistrationSchema.index({ 'participants.email': 1 });
BulkRegistrationSchema.index({ bulkRegistrationNumber: 1 });

export default mongoose.model<IBulkRegistration>('BulkRegistration', BulkRegistrationSchema);
