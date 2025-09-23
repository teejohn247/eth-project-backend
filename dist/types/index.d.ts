import { Document } from 'mongoose';
import { Request } from 'express';
export interface IUser extends Document {
    firstName: string;
    lastName: string;
    email: string;
    password?: string;
    role: 'contestant' | 'admin' | 'judge' | 'sponsor';
    isEmailVerified: boolean;
    isPasswordSet: boolean;
    emailVerificationToken?: string;
    passwordResetToken?: string;
    passwordResetExpires?: Date;
    lastLogin?: Date;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    comparePassword(candidatePassword: string): Promise<boolean>;
}
export interface IOTP extends Document {
    email: string;
    otp: string;
    type: 'email_verification' | 'password_reset';
    expiresAt: Date;
    isUsed: boolean;
    createdAt: Date;
}
export interface IOTPModel {
    generateOTP(): string;
    createOTP(email: string, type: 'email_verification' | 'password_reset', expiryMinutes?: number): Promise<IOTP>;
    verifyOTP(email: string, otp: string, type: 'email_verification' | 'password_reset'): Promise<{
        valid: boolean;
        message: string;
    }>;
    checkOTP(email: string, otp: string, type: 'email_verification' | 'password_reset'): Promise<{
        valid: boolean;
        message: string;
    }>;
}
export interface AuthRequest {
    email: string;
    password: string;
}
export interface RegisterRequest {
    firstName: string;
    lastName: string;
    email: string;
}
export interface VerifyOTPRequest {
    email: string;
    otp: string;
}
export interface SetPasswordRequest {
    email: string;
    password: string;
}
export interface ForgotPasswordRequest {
    email: string;
}
export interface AuthResponse {
    success: boolean;
    message: string;
    data?: {
        token?: string;
        user?: {
            id: string;
            firstName: string;
            lastName: string;
            email: string;
            role: string;
            isEmailVerified: boolean;
            isPasswordSet: boolean;
            registrationInfo?: {
                currentStep: number;
                currentStepName: string;
                lastStep: number;
                lastStepName: string;
                registrationComplete: boolean;
                registrationStatus: string | null;
                paymentStatus: string | null;
                completedSteps: number[];
                registrationNumber: string | null;
                registrationType: string | null;
            };
        };
        otpType?: string;
        nextStep?: string;
    };
}
export interface OTPResponse {
    success: boolean;
    message: string;
    data?: {
        email: string;
        expiresAt: Date;
    };
}
export interface AuthenticatedRequest extends Request {
    user?: {
        userId: string;
        email: string;
        role: string;
        isEmailVerified: boolean;
        isPasswordSet: boolean;
    };
}
//# sourceMappingURL=index.d.ts.map