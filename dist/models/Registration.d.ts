import mongoose, { Document } from 'mongoose';
export interface IRegistration extends Document {
    userId: mongoose.Types.ObjectId;
    registrationNumber: string;
    registrationType: 'individual' | 'group';
    personalInfo: {
        firstName: string;
        lastName: string;
        email: string;
        phoneNo: string;
        dateOfBirth?: Date;
        age?: number;
        placeOfBirth?: string;
        gender?: 'Male' | 'Female';
        maritalStatus?: 'Single' | 'Married';
        address?: string;
        state?: string;
        lga?: string;
        nationality?: string;
        tshirtSize?: 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL';
    };
    talentInfo: {
        talentCategory?: 'Singing' | 'Dancing' | 'Acting' | 'Comedy' | 'Drama' | 'Instrumental' | 'Other';
        otherTalentCategory?: string;
        skillLevel?: 'Beginner' | 'Intermediate' | 'Advanced';
        stageName?: string;
        previouslyParticipated?: 'Yes' | 'No';
        previousParticipation?: {
            previousParticipationCategory?: 'Singing' | 'Dancing' | 'Acting' | 'Comedy' | 'Drama' | 'Instrumental' | 'Other';
            previousParticipationOtherCategory?: string;
            competitionName?: string;
            participationPosition?: string;
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
        auditionLocation: string;
        auditionDate?: Date;
        auditionTime: string;
        auditionRequirement?: string;
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
declare const _default: mongoose.Model<IRegistration, {}, {}, {}, mongoose.Document<unknown, {}, IRegistration> & IRegistration & {
    _id: mongoose.Types.ObjectId;
}, any>;
export default _default;
//# sourceMappingURL=Registration.d.ts.map