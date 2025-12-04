import mongoose, { Document } from 'mongoose';
export interface IContestant extends Document {
    userId: mongoose.Types.ObjectId;
    registrationId: mongoose.Types.ObjectId;
    contestantNumber: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNo: string;
    dateOfBirth?: Date;
    age?: number;
    gender?: 'Male' | 'Female';
    state?: string;
    lga?: string;
    talentCategory?: 'Singing' | 'Dancing' | 'Acting' | 'Comedy' | 'Drama' | 'Instrumental' | 'Other';
    stageName?: string;
    skillLevel?: 'Beginner' | 'Intermediate' | 'Advanced';
    profilePhoto?: {
        url?: string;
        publicId?: string;
    };
    videoUpload?: {
        url?: string;
        publicId?: string;
        thumbnailUrl?: string;
    };
    status: 'active' | 'inactive' | 'eliminated' | 'winner';
    isQualified: boolean;
    qualifiedAt?: Date;
    totalVotes: number;
    totalVoteAmount: number;
    registrationNumber: string;
    registrationType: 'individual' | 'group' | 'bulk';
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<IContestant, {}, {}, {}, mongoose.Document<unknown, {}, IContestant> & IContestant & {
    _id: mongoose.Types.ObjectId;
}, any>;
export default _default;
//# sourceMappingURL=Contestant.d.ts.map