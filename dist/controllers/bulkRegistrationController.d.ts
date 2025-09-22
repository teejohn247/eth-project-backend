import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
export declare const createBulkRegistration: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const processBulkPayment: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const addParticipant: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getBulkRegistration: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const listBulkRegistrations: (req: AuthenticatedRequest, res: Response) => Promise<void>;
//# sourceMappingURL=bulkRegistrationController.d.ts.map