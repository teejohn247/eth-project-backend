import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
export declare const getUserRegistrations: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const createRegistration: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getRegistration: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const updateRegistration: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const submitRegistration: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const updatePersonalInfo: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const updateTalentInfo: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const updateGroupInfo: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const updateGuardianInfo: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const updateAuditionInfo: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const updateTermsConditions: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getRegistrationStatus: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const deleteRegistration: (req: AuthenticatedRequest, res: Response) => Promise<void>;
//# sourceMappingURL=registrationController.d.ts.map