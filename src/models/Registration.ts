import mongoose, { Schema, Document } from 'mongoose';

export interface IRegistration extends Document {
  userId: mongoose.Types.ObjectId;
  registrationNumber: string;
  registrationType: 'individual' | 'group';
  
  personalInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phoneNo: string;
    dateOfBirth?: Date;
    age?: number;
    placeOfBirth?: string;
    gender?: 'Male' | 'Female';
    maritalStatus?: 'Single' | 'Married';
    address?: string;
    state?: string;
    lga?: string;
    nationality?: string;
    tshirtSize?: 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL';
  };

  talentInfo: {
    talentCategory?: 'Singing' | 'Dancing' | 'Acting' | 'Comedy' | 'Drama' | 'Instrumental' | 'Other';
    otherTalentCategory?: string;
    skillLevel?: 'Beginner' | 'Intermediate' | 'Advanced';
    stageName?: string;
    previouslyParticipated?: 'Yes' | 'No';
    previousParticipation?: {
      previousParticipationCategory?: 'Singing' | 'Dancing' | 'Acting' | 'Comedy' | 'Drama' | 'Instrumental' | 'Other';
      previousParticipationOtherCategory?: string;
      competitionName?: string;
      participationPosition?: string;
    };
  };

  groupInfo?: {
    groupName?: string;
    noOfGroupMembers?: number;
    members?: Array<{
      firstName: string;
      lastName: string;
      dateOfBirth: Date;
      gender: 'Male' | 'Female';
      tshirtSize: 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL';
    }>;
  };

  guardianInfo?: {
    title?: 'Mr' | 'Mrs' | 'Miss';
    guardianName?: string;
    relationship?: 'Father' | 'Mother' | 'Aunt' | 'Uncle' | 'Brother' | 'Sister' | 'Other';
    otherRelationship?: string;
    guardianEmail?: string;
    guardianPhoneNo?: string;
    guardianAddress?: string;
    guardianState?: string;
  };

  mediaInfo?: {
    profilePhoto?: {
      url?: string;        // Cloudinary URL
      publicId?: string;   // Cloudinary public ID for management
      format?: string;     // Image format (jpg, png, etc.)
      width?: number;      // Image width
      height?: number;     // Image height
      bytes?: number;      // File size in bytes
    };
    videoUpload?: {
      url?: string;        // Cloudinary URL
      publicId?: string;   // Cloudinary public ID for management
      format?: string;     // Video format (mp4, mov, etc.)
      width?: number;      // Video width
      height?: number;     // Video height
      duration?: number;   // Video duration in seconds
      bytes?: number;      // File size in bytes
      thumbnailUrl?: string; // Video thumbnail URL
    };
  };

  auditionInfo: {
    auditionLocation: string;
    auditionDate?: Date;
    auditionTime: string;
    auditionRequirement?: string;
    otherRequirement?: string;
    hasInstrument?: 'Yes' | 'No';
  };

  termsConditions: {
    rulesAcceptance: boolean;
    promotionalAcceptance: boolean;
    contestantSignature?: string;
    guardianSignature?: string;
    signedAt?: Date;
  };

  paymentInfo: {
    amount: number;
    currency: string;
    paymentStatus: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
    paymentReference?: string;
    transactionId?: string;
    paymentMethod?: string;
    paidAt?: Date;
    paymentResponse?: any;
  };

  status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'qualified' | 'disqualified';
  currentStep: number;
  completedSteps: number[];
  submittedAt?: Date;
  reviewedAt?: Date;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const RegistrationSchema = new Schema<IRegistration>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  registrationNumber: { type: String, unique: true },
  registrationType: { type: String, enum: ['individual', 'group'], required: true },
  
  personalInfo: {
    firstName: { type: String, default: '' },
    lastName: { type: String, default: '' },
    email: { type: String, default: '' },
    phoneNo: { type: String, default: '' },
    dateOfBirth: { type: Date },
    age: Number,
    placeOfBirth: String,
    gender: { type: String, enum: ['Male', 'Female'] },
    maritalStatus: { type: String, enum: ['Single', 'Married'] },
    address: String,
    state: String,
    lga: String,
    nationality: String,
    tshirtSize: { type: String, enum: ['XS', 'S', 'M', 'L', 'XL', 'XXL'] }
  },

  talentInfo: {
    talentCategory: { 
      type: String, 
      enum: ['Singing', 'Dancing', 'Acting', 'Comedy', 'Drama', 'Instrumental', 'Other']
    },
    otherTalentCategory: String,
    skillLevel: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'] },
    stageName: String,
    previouslyParticipated: { type: String, enum: ['Yes', 'No'] },
    previousParticipation: {
      previousParticipationCategory: { type: String, enum: ['Singing', 'Dancing', 'Acting', 'Comedy', 'Drama', 'Instrumental', 'Other'] },
      previousParticipationOtherCategory: String,
      competitionName: String,
      participationPosition: String
    }
  },

  groupInfo: {
    groupName: String,
    noOfGroupMembers: { type: Number, min: 2, max: 5 },
    members: [{
      firstName: { type: String, required: true },
      lastName: { type: String, required: true },
      dateOfBirth: { type: Date, required: true },
      gender: { type: String, enum: ['Male', 'Female'], required: true },
      tshirtSize: { type: String, enum: ['XS', 'S', 'M', 'L', 'XL', 'XXL'], required: true }
    }]
  },

  guardianInfo: {
    title: { type: String, enum: ['Mr', 'Mrs', 'Miss'] },
    guardianName: String,
    relationship: { type: String, enum: ['Father', 'Mother', 'Aunt', 'Uncle', 'Brother', 'Sister', 'Other'] },
    otherRelationship: String,
    guardianEmail: String,
    guardianPhoneNo: String,
    guardianAddress: String,
    guardianState: String
  },

  mediaInfo: {
    profilePhoto: {
      url: String,        // Cloudinary URL
      publicId: String,   // Cloudinary public ID for management
      format: String,     // Image format (jpg, png, etc.)
      width: Number,      // Image width
      height: Number,     // Image height
      bytes: Number       // File size in bytes
    },
    videoUpload: {
      url: String,        // Cloudinary URL
      publicId: String,   // Cloudinary public ID for management
      format: String,     // Video format (mp4, mov, etc.)
      width: Number,      // Video width
      height: Number,     // Video height
      duration: Number,   // Video duration in seconds
      bytes: Number,      // File size in bytes
      thumbnailUrl: String // Video thumbnail URL
    }
  },

  auditionInfo: {
    auditionLocation: { type: String, default: '' },
    auditionDate: { type: Date },
    auditionTime: { type: String, default: '' },
    auditionRequirement: { 
      type: String
    },
    otherRequirement: String,
    hasInstrument: { type: String, enum: ['Yes', 'No'] }
  },

  termsConditions: {
    rulesAcceptance: { type: Boolean, default: false },
    promotionalAcceptance: { type: Boolean, default: false },
    contestantSignature: String,
    guardianSignature: String,
    signedAt: { type: Date, default: Date.now }
  },

  paymentInfo: {
    amount: { type: Number, default: 0 },
    currency: { type: String, default: 'NGN' },
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

  status: { 
    type: String, 
    enum: ['draft', 'submitted', 'under_review', 'approved', 'rejected', 'qualified', 'disqualified'],
    default: 'draft' 
  },
  
  currentStep: { type: Number, default: 0 },
  completedSteps: [Number],
  submittedAt: Date,
  reviewedAt: Date,
  reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  reviewNotes: String
}, {
  timestamps: true
});

// Pre-save middleware to generate registration number
RegistrationSchema.pre('save', async function(next) {
  if (this.isNew && !this.registrationNumber) {
    const count = await mongoose.model('Registration').countDocuments();
    this.registrationNumber = `ETH2024${String(count + 1).padStart(3, '0')}`;
  }
  
  // Calculate age from date of birth
  if (this.personalInfo.dateOfBirth) {
    const today = new Date();
    const birthDate = new Date(this.personalInfo.dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    this.personalInfo.age = age;
  }
  
  next();
});

// Indexes for performance
RegistrationSchema.index({ userId: 1 });
RegistrationSchema.index({ registrationNumber: 1 });
RegistrationSchema.index({ status: 1 });
RegistrationSchema.index({ 'paymentInfo.paymentStatus': 1 });
RegistrationSchema.index({ createdAt: -1 });

export default mongoose.model<IRegistration>('Registration', RegistrationSchema);
