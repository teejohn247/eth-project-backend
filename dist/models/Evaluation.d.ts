import mongoose, { Document } from 'mongoose';
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
declare const _default: mongoose.Model<IEvaluation, {}, {}, {}, mongoose.Document<unknown, {}, IEvaluation> & IEvaluation & {
    _id: mongoose.Types.ObjectId;
}, any>;
export default _default;
//# sourceMappingURL=Evaluation.d.ts.map