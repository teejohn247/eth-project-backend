import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../types';
export declare const promoteToContestant: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getContestants: (req: Request, res: Response) => Promise<void>;
export declare const getContestant: (req: Request, res: Response) => Promise<void>;
export declare const voteForContestant: (req: Request, res: Response) => Promise<void>;
export declare const verifyVotePayment: (req: Request, res: Response) => Promise<void>;
export declare const getContestantVotes: (req: Request, res: Response) => Promise<void>;
export declare const getAllVotes: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=contestantController.d.ts.map