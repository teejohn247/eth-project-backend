import mongoose, { Schema, Document } from 'mongoose';

export interface IAuditionSchedule extends Document {
  location: 'Lagos' | 'Benin';
  date: Date;
  timeSlots: Array<{
    time: string;
    maxContestants: number;
    bookedContestants: number;
    isAvailable: boolean;
  }>;
  venue: {
    name?: string;
    address?: string;
    capacity?: number;
    facilities?: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

const AuditionScheduleSchema = new Schema<IAuditionSchedule>({
  location: { type: String, enum: ['Lagos', 'Benin'], required: true },
  date: { type: Date, required: true },
  timeSlots: [{
    time: { type: String, required: true },
    maxContestants: { type: Number, default: 20 },
    bookedContestants: { type: Number, default: 0 },
    isAvailable: { type: Boolean, default: true }
  }],
  venue: {
    name: String,
    address: String,
    capacity: Number,
    facilities: [String]
  }
}, {
  timestamps: true
});

// Indexes
AuditionScheduleSchema.index({ location: 1, date: 1 });
AuditionScheduleSchema.index({ date: 1 });

export default mongoose.model<IAuditionSchedule>('AuditionSchedule', AuditionScheduleSchema);
