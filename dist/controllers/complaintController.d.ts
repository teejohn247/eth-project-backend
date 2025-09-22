import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
export declare const createComplaint: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getUserComplaints: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getComplaintById: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getAllComplaints: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const updateComplaintStatus: (req: AuthenticatedRequest, res: Response) => Promise<void>;
//# sourceMappingURL=complaintController.d.ts.map