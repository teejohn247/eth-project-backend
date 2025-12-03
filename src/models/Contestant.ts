import mongoose, { Schema, Document } from 'mongoose';

export interface IContestant extends Document {
  userId: mongoose.Types.ObjectId;
  registrationId: mongoose.Types.ObjectId;
  contestantNumber: string; // Unique contestant identifier
  
  // Personal Information (from Registration)
  firstName: string;
  lastName: string;
  email: string;
  phoneNo: string;
  dateOfBirth?: Date;
  age?: number;
  gender?: 'Male' | 'Female';
  state?: string;
  lga?: string;
  
  // Talent Information (from Registration)
  talentCategory?: 'Singing' | 'Dancing' | 'Acting' | 'Comedy' | 'Drama' | 'Instrumental' | 'Other';
  stageName?: string;
  skillLevel?: 'Beginner' | 'Intermediate' | 'Advanced';
  
  // Media (from Registration)
  profilePhoto?: {
    url?: string;
    publicId?: string;
  };
  videoUpload?: {
    url?: string;
    publicId?: string;
    thumbnailUrl?: string;
  };
  
  // Contestant Status
  status: 'active' | 'inactive' | 'eliminated' | 'winner';
  isQualified: boolean;
  qualifiedAt?: Date;
  
  // Voting Statistics
  totalVotes: number;
  totalVoteAmount: number; // Total amount paid for votes
  
  // Registration reference
  registrationNumber: string;
  registrationType: 'individual' | 'group' | 'bulk';
  
  createdAt: Date;
  updatedAt: Date;
}

const ContestantSchema = new Schema<IContestant>({
  userId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true
  },
  registrationId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Registration', 
    required: true,
    unique: true,
    index: true
  },
  contestantNumber: {
    type: String,
    unique: true,
    required: true,
    index: true
  },
  
  // Personal Information
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  email: { type: String, required: true, lowercase: true, trim: true, index: true },
  phoneNo: { type: String, required: true, trim: true },
  dateOfBirth: Date,
  age: Number,
  gender: { type: String, enum: ['Male', 'Female'] },
  state: String,
  lga: String,
  
  // Talent Information
  talentCategory: { 
    type: String, 
    enum: ['Singing', 'Dancing', 'Acting', 'Comedy', 'Drama', 'Instrumental', 'Other']
  },
  stageName: String,
  skillLevel: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'] },
  
  // Media
  profilePhoto: {
    url: String,
    publicId: String
  },
  videoUpload: {
    url: String,
    publicId: String,
    thumbnailUrl: String
  },
  
  // Status
  status: {
    type: String,
    enum: ['active', 'inactive', 'eliminated', 'winner'],
    default: 'active'
  },
  isQualified: {
    type: Boolean,
    default: false
  },
  qualifiedAt: Date,
  
  // Voting Statistics
  totalVotes: {
    type: Number,
    default: 0,
    min: 0
  },
  totalVoteAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Registration reference
  registrationNumber: { type: String, required: true },
  registrationType: { 
    type: String, 
    enum: ['individual', 'group', 'bulk'], 
    required: true 
  }
}, {
  timestamps: true
});

// Indexes
ContestantSchema.index({ contestantNumber: 1 });
ContestantSchema.index({ email: 1 });
ContestantSchema.index({ status: 1 });
ContestantSchema.index({ totalVotes: -1 });
ContestantSchema.index({ talentCategory: 1 });

// Pre-save middleware to generate contestant number
ContestantSchema.pre('save', async function(next) {
  if (this.isNew && !this.contestantNumber) {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    this.contestantNumber = `CNT${timestamp}${random}`;
  }
  next();
});

export default mongoose.model<IContestant>('Contestant', ContestantSchema);

