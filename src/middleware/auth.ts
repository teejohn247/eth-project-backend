import { Request, Response, NextFunction } from 'express';
import { verifyToken, JWTPayload } from '../utils/jwt';
import { User } from '../models';
import { AuthenticatedRequest } from '../types';

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

export const authenticateToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Access token is required'
      });
      return;
    }

    const decoded = verifyToken(token);
    
    // Verify user still exists
    const user = await User.findById(decoded.userId);
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    req.user = decoded;
    next();
  } catch (error) {
    // res.status(403).json({
    //   success: false,
    //   message: 'Invalid or expired token'
    // });
  }
};

export const requireEmailVerification = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user?.isEmailVerified) {
    res.status(403).json({
      success: false,
      message: 'Email verification required'
    });
    return;
  }
  next();
};

export const requirePasswordSet = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user?.isPasswordSet) {
    res.status(403).json({
      success: false,
      message: 'Password setup required'
    });
    return;
  }
  next();
};

export const requireCompleteProfile = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user?.isEmailVerified || !req.user?.isPasswordSet) {
    res.status(403).json({
      success: false,
      message: 'Complete profile setup required'
    });
    return;
  }
  next();
};

// Role-based access control
export const requireRole = (allowedRoles: string | string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const userRole = req.user?.role || 'contestant';
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    
    if (!roles.includes(userRole)) {
      res.status(403).json({
        success: false,
        message: `Access denied. Required role(s): ${roles.join(', ')}`
      });
      return;
    }
    next();
  };
};

// Admin only access
export const requireAdmin = requireRole('admin');

// Judge or admin access
export const requireJudgeOrAdmin = requireRole(['judge', 'admin']);
