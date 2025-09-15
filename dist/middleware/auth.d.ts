import { Request, Response, NextFunction } from 'express';
import { JWTPayload } from '../utils/jwt';
import { AuthenticatedRequest } from '../types';
declare global {
    namespace Express {
        interface Request {
            user?: JWTPayload;
        }
    }
}
export declare const authenticateToken: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const requireEmailVerification: (req: Request, res: Response, next: NextFunction) => void;
export declare const requirePasswordSet: (req: Request, res: Response, next: NextFunction) => void;
export declare const requireCompleteProfile: (req: Request, res: Response, next: NextFunction) => void;
export declare const requireRole: (allowedRoles: string | string[]) => (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
export declare const requireAdmin: (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
export declare const requireJudgeOrAdmin: (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
//# sourceMappingURL=auth.d.ts.map