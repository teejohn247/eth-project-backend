import mongoose, { Schema, Model } from 'mongoose';
import { IOTP, IOTPModel } from '../types';

const OTPSchema: Schema = new Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please enter a valid email address'
    ]
  },
  otp: {
    type: String,
    required: [true, 'OTP is required'],
    length: [4, 'OTP must be exactly 4 digits']
  },
  type: {
    type: String,
    required: [true, 'OTP type is required'],
    enum: ['email_verification', 'password_reset']
  },
  expiresAt: {
    type: Date,
    required: [true, 'Expiry date is required'],
    index: { expireAfterSeconds: 0 } // MongoDB TTL index for automatic cleanup
  },
  isUsed: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Compound index for faster lookups
OTPSchema.index({ email: 1, type: 1, isUsed: 1 });
OTPSchema.index({ email: 1, otp: 1, type: 1 });

// Static method to generate random OTP
OTPSchema.statics.generateOTP = function(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

// Static method to create new OTP
OTPSchema.statics.createOTP = async function(
  email: string, 
  type: 'email_verification' | 'password_reset',
  expiryMinutes: number = 10
) {
  // Invalidate any existing unused OTPs for this email and type
  await this.updateMany(
    { email, type, isUsed: false },
    { isUsed: true }
  );

  const generateOTP = (): string => {
    return Math.floor(1000 + Math.random() * 9000).toString();
  };

  const otp = generateOTP();
  const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

  const otpDoc = new this({
    email,
    otp,
    type,
    expiresAt,
    isUsed: false
  });

  await otpDoc.save();
  return otpDoc;
};

// Static method to verify OTP
OTPSchema.statics.verifyOTP = async function(
  email: string,
  otp: string,
  type: 'email_verification' | 'password_reset'
) {
  const otpDoc = await this.findOne({
    email,
    otp,
    type,
    isUsed: false,
    expiresAt: { $gt: new Date() }
  });

  if (!otpDoc) {
    return { valid: false, message: 'Invalid or expired OTP' };
  }

  // Mark OTP as used
  otpDoc.isUsed = true;
  await otpDoc.save();

  return { valid: true, message: 'OTP verified successfully' };
};

// Static method to check OTP validity without consuming it
OTPSchema.statics.checkOTP = async function(
  email: string,
  otp: string,
  type: 'email_verification' | 'password_reset'
) {
  const otpDoc = await this.findOne({
    email,
    otp,
    type,
    isUsed: false,
    expiresAt: { $gt: new Date() }
  });

  if (!otpDoc) {
    return { valid: false, message: 'Invalid or expired OTP' };
  }

  return { valid: true, message: 'OTP is valid' };
};

export default mongoose.model<IOTP, Model<IOTP> & IOTPModel>('OTP', OTPSchema);
