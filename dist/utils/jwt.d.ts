import { IUser } from '../types';
export interface JWTPayload {
    userId: string;
    email: string;
    isEmailVerified: boolean;
    isPasswordSet: boolean;
    role: string;
}
export declare const generateToken: (user: IUser) => string;
export declare const verifyToken: (token: string) => JWTPayload;
export declare const decodeToken: (token: string) => JWTPayload | null;
//# sourceMappingURL=jwt.d.ts.map