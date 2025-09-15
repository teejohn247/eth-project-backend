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
    dateOfBirth: Date;
    age?: number;
    placeOfBirth?: string;
    gender: 'Male' | 'Female';
    maritalStatus?: 'Single' | 'Married';
    address?: string;
    state?: string;
    lga?: string;
    nationality?: string;
    tshirtSize: 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL';
  };

  talentInfo: {
    talentCategory: 'Singing' | 'Dancing' | 'Acting' | 'Comedy' | 'Drama' | 'Instrumental' | 'Other';
    otherTalentCategory?: string;
    skillLevel: 'Beginner' | 'Intermediate' | 'Advanced';
    stageName?: string;
    previouslyParticipated?: 'Yes' | 'No';
    previousParticipation?: {
      category?: 'Singing' | 'Dancing' | 'Acting' | 'Comedy' | 'Drama' | 'Instrumental' | 'Other';
      otherCategory?: string;
      competitionName?: string;
      position?: string;
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
      originalName?: string;
      filename?: string;
      path?: string;
      size?: number;
      mimetype?: string;
    };
    videoUpload?: {
      originalName?: string;
      filename?: string;
      path?: string;
      size?: number;
      mimetype?: string;
      duration?: number;
    };
  };

  auditionInfo: {
    auditionLocation: 'Lagos' | 'Benin';
    auditionDate: Date;
    auditionTime: string;
    auditionRequirement?: 'Microphone' | 'Guitar' | 'Bass' | 'Drum' | 'BackgroundMusic' | 'StageLighting' | 'Projector' | 'Other';
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
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    phoneNo: { type: String, required: true },
    dateOfBirth: { type: Date, required: true },
    age: Number,
    placeOfBirth: String,
    gender: { type: String, enum: ['Male', 'Female'], required: true },
    maritalStatus: { type: String, enum: ['Single', 'Married'] },
    address: String,
    state: String,
    lga: String,
    nationality: String,
    tshirtSize: { type: String, enum: ['XS', 'S', 'M', 'L', 'XL', 'XXL'], required: true }
  },

  talentInfo: {
    talentCategory: { 
      type: String, 
      enum: ['Singing', 'Dancing', 'Acting', 'Comedy', 'Drama', 'Instrumental', 'Other'],
      required: true 
    },
    otherTalentCategory: String,
    skillLevel: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'], required: true },
    stageName: String,
    previouslyParticipated: { type: String, enum: ['Yes', 'No'] },
    previousParticipation: {
      category: { type: String, enum: ['Singing', 'Dancing', 'Acting', 'Comedy', 'Drama', 'Instrumental', 'Other'] },
      otherCategory: String,
      competitionName: String,
      position: String
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
      originalName: String,
      filename: String,
      path: String,
      size: Number,
      mimetype: String
    },
    videoUpload: {
      originalName: String,
      filename: String,
      path: String,
      size: Number,
      mimetype: String,
      duration: Number
    }
  },

  auditionInfo: {
    auditionLocation: { type: String, enum: ['Lagos', 'Benin'], required: true },
    auditionDate: { type: Date, required: true },
    auditionTime: { type: String, required: true },
    auditionRequirement: { 
      type: String, 
      enum: ['Microphone', 'Guitar', 'Bass', 'Drum', 'BackgroundMusic', 'StageLighting', 'Projector', 'Other'] 
    },
    otherRequirement: String,
    hasInstrument: { type: String, enum: ['Yes', 'No'] }
  },

  termsConditions: {
    rulesAcceptance: { type: Boolean, required: true },
    promotionalAcceptance: { type: Boolean, required: true },
    contestantSignature: String,
    guardianSignature: String,
    signedAt: { type: Date, default: Date.now }
  },

  paymentInfo: {
    amount: { type: Number, required: true, default: 1090 },
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
