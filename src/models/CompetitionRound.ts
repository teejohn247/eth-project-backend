import mongoose, { Schema, Document } from 'mongoose';

export interface ICompetitionRound extends Document {
  name: string;
  roundNumber: number;
  status: 'upcoming' | 'ongoing' | 'completed';
  startDate: Date;
  endDate: Date;
  maxParticipants?: number;
  currentParticipants: number;
  eliminationCriteria?: 'score_based' | 'percentage_based' | 'manual_selection';
  eliminationThreshold?: number;
  participants: mongoose.Types.ObjectId[];
  qualifiedParticipants: mongoose.Types.ObjectId[];
  createdAt: Date;
}

const CompetitionRoundSchema = new Schema<ICompetitionRound>({
  name: { type: String, required: true },
  roundNumber: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['upcoming', 'ongoing', 'completed'],
    default: 'upcoming' 
  },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  maxParticipants: Number,
  currentParticipants: { type: Number, default: 0 },
  eliminationCriteria: {
    type: String,
    enum: ['score_based', 'percentage_based', 'manual_selection']
  },
  eliminationThreshold: Number,
  participants: [{ type: Schema.Types.ObjectId, ref: 'Registration' }],
  qualifiedParticipants: [{ type: Schema.Types.ObjectId, ref: 'Registration' }]
}, {
  timestamps: true
});

// Indexes
CompetitionRoundSchema.index({ roundNumber: 1 });
CompetitionRoundSchema.index({ status: 1 });
CompetitionRoundSchema.index({ startDate: 1 });

export default mongoose.model<ICompetitionRound>('CompetitionRound', CompetitionRoundSchema);
