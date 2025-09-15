import mongoose, { Document } from 'mongoose';
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
declare const _default: mongoose.Model<ICompetitionRound, {}, {}, {}, mongoose.Document<unknown, {}, ICompetitionRound> & ICompetitionRound & {
    _id: mongoose.Types.ObjectId;
}, any>;
export default _default;
//# sourceMappingURL=CompetitionRound.d.ts.map