import { Schema, Document } from 'mongoose';
export interface IComplaint extends Document {
    userId: Schema.Types.ObjectId;
    complaintType: string;
    description: string;
    status: 'Pending' | 'In Progress' | 'Resolved' | 'Closed';
    resolvedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: import("mongoose").Model<IComplaint, {}, {}, {}, Document<unknown, {}, IComplaint> & IComplaint & {
    _id: import("mongoose").Types.ObjectId;
}, any>;
export default _default;
//# sourceMappingURL=Complaint.d.ts.map