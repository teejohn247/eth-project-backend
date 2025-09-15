import { Request, Response, NextFunction } from 'express';
export declare const handleValidationErrors: (req: Request, res: Response, next: NextFunction) => void;
export declare const validateRegistration: (import("express-validator").ValidationChain | ((req: Request, res: Response, next: NextFunction) => void))[];
export declare const validatePersonalInfo: (import("express-validator").ValidationChain | ((req: Request, res: Response, next: NextFunction) => void))[];
export declare const validateTalentInfo: (import("express-validator").ValidationChain | ((req: Request, res: Response, next: NextFunction) => void))[];
export declare const validateGroupInfo: (import("express-validator").ValidationChain | ((req: Request, res: Response, next: NextFunction) => void))[];
export declare const validateGuardianInfo: (import("express-validator").ValidationChain | ((req: Request, res: Response, next: NextFunction) => void))[];
export declare const validateAuditionInfo: (import("express-validator").ValidationChain | ((req: Request, res: Response, next: NextFunction) => void))[];
export declare const validateTermsConditions: (import("express-validator").ValidationChain | ((req: Request, res: Response, next: NextFunction) => void))[];
export declare const validatePayment: (import("express-validator").ValidationChain | ((req: Request, res: Response, next: NextFunction) => void))[];
export declare const validateMediaInfo: (import("express-validator").ValidationChain | ((req: Request, res: Response, next: NextFunction) => void))[];
export declare const validateFileUpload: (import("express-validator").ValidationChain | ((req: Request, res: Response, next: NextFunction) => void))[];
export declare const validateRegistrationStatusUpdate: (import("express-validator").ValidationChain | ((req: Request, res: Response, next: NextFunction) => void))[];
export declare const validateEvaluation: (import("express-validator").ValidationChain | ((req: Request, res: Response, next: NextFunction) => void))[];
//# sourceMappingURL=validation.d.ts.map