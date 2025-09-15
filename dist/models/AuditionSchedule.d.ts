import mongoose, { Document } from 'mongoose';
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
declare const _default: mongoose.Model<IAuditionSchedule, {}, {}, {}, mongoose.Document<unknown, {}, IAuditionSchedule> & IAuditionSchedule & {
    _id: mongoose.Types.ObjectId;
}, any>;
export default _default;
//# sourceMappingURL=AuditionSchedule.d.ts.map