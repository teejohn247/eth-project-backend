import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../types';
export declare const initializePayment: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const verifyPayment: (req: Request, res: Response) => Promise<void>;
export declare const getPaymentStatus: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const handlePaymentWebhook: (req: Request, res: Response) => Promise<void>;
export declare const handleTicketPaymentWebhook: (req: Request, res: Response) => Promise<void>;
export declare const refundPayment: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const savePaymentInfo: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getAllPayments: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const updatePaymentTransaction: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const createTransaction: (req: AuthenticatedRequest, res: Response) => Promise<void>;
//# sourceMappingURL=paymentController.d.ts.map