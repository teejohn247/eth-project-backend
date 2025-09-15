import jwt from 'jsonwebtoken';
import { IUser } from '../types';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export interface JWTPayload {
  userId: string;
  email: string;
  isEmailVerified: boolean;
  isPasswordSet: boolean;
  role: string;
}

export const generateToken = (user: IUser): string => {
  const payload: JWTPayload = {
    userId: user._id.toString(),
    email: user.email,
    isEmailVerified: user.isEmailVerified,
    isPasswordSet: user.isPasswordSet,
    role: user.role
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
    issuer: 'edo-talent-hunt',
    audience: 'edo-talent-hunt-users'
  } as jwt.SignOptions);
};

export const verifyToken = (token: string): JWTPayload => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'edo-talent-hunt',
      audience: 'edo-talent-hunt-users'
    }) as JWTPayload;
    
    return decoded;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

export const decodeToken = (token: string): JWTPayload | null => {
  try {
    return jwt.decode(token) as JWTPayload;
  } catch (error) {
    return null;
  }
};
