import { Schema, model, Document } from 'mongoose';

export interface IComplaint extends Document {
  userId: Schema.Types.ObjectId;
  complaintType: string;
  description: string;
  status: 'Pending' | 'In Progress' | 'Resolved' | 'Closed';
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ComplaintSchema = new Schema<IComplaint>({
  userId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  complaintType: { 
    type: String, 
    required: true,
    trim: true
  },
  description: { 
    type: String, 
    required: true,
    trim: true
  },
  status: { 
    type: String, 
    enum: ['Pending', 'In Progress', 'Resolved', 'Closed'],
    default: 'Pending'
  },
  resolvedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for performance
ComplaintSchema.index({ userId: 1, createdAt: -1 });
ComplaintSchema.index({ status: 1 });

export default model<IComplaint>('Complaint', ComplaintSchema);
