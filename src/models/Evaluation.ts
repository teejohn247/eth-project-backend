import mongoose, { Schema, Document } from 'mongoose';

export interface IEvaluation extends Document {
  registrationId: mongoose.Types.ObjectId;
  judgeId: mongoose.Types.ObjectId;
  auditionDate: Date;
  scores: {
    talent?: number;
    presentation?: number;
    creativity?: number;
    overall?: number;
  };
  totalScore?: number;
  feedback: {
    strengths?: string;
    areasForImprovement?: string;
    generalComments?: string;
  };
  recommendation: 'advance' | 'eliminate' | 'callback';
  evaluatedAt: Date;
  createdAt: Date;
}

const EvaluationSchema = new Schema<IEvaluation>({
  registrationId: { type: Schema.Types.ObjectId, ref: 'Registration', required: true },
  judgeId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  auditionDate: { type: Date, required: true },
  
  scores: {
    talent: { type: Number, min: 0, max: 10 },
    presentation: { type: Number, min: 0, max: 10 },
    creativity: { type: Number, min: 0, max: 10 },
    overall: { type: Number, min: 0, max: 10 }
  },
  
  totalScore: { type: Number, min: 0, max: 40 },
  
  feedback: {
    strengths: String,
    areasForImprovement: String,
    generalComments: String
  },
  
  recommendation: { 
    type: String, 
    enum: ['advance', 'eliminate', 'callback'],
    required: true 
  },
  
  evaluatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Pre-save middleware to calculate total score
EvaluationSchema.pre('save', function(next) {
  if (this.scores) {
    const { talent = 0, presentation = 0, creativity = 0, overall = 0 } = this.scores;
    this.totalScore = talent + presentation + creativity + overall;
  }
  next();
});

// Indexes
EvaluationSchema.index({ registrationId: 1 });
EvaluationSchema.index({ judgeId: 1 });
EvaluationSchema.index({ auditionDate: 1 });
EvaluationSchema.index({ totalScore: -1 });

export default mongoose.model<IEvaluation>('Evaluation', EvaluationSchema);
