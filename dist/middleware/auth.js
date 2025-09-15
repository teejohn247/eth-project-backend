"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireJudgeOrAdmin = exports.requireAdmin = exports.requireRole = exports.requireCompleteProfile = exports.requirePasswordSet = exports.requireEmailVerification = exports.authenticateToken = void 0;
const jwt_1 = require("../utils/jwt");
const models_1 = require("../models");
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];
        if (!token) {
            res.status(401).json({
                success: false,
                message: 'Access token is required'
            });
            return;
        }
        const decoded = (0, jwt_1.verifyToken)(token);
        const user = await models_1.User.findById(decoded.userId);
        if (!user) {
            res.status(401).json({
                success: false,
                message: 'User not found'
            });
            return;
        }
        req.user = decoded;
        next();
    }
    catch (error) {
        res.status(403).json({
            success: false,
            message: 'Invalid or expired token'
        });
    }
};
exports.authenticateToken = authenticateToken;
const requireEmailVerification = (req, res, next) => {
    if (!req.user?.isEmailVerified) {
        res.status(403).json({
            success: false,
            message: 'Email verification required'
        });
        return;
    }
    next();
};
exports.requireEmailVerification = requireEmailVerification;
const requirePasswordSet = (req, res, next) => {
    if (!req.user?.isPasswordSet) {
        res.status(403).json({
            success: false,
            message: 'Password setup required'
        });
        return;
    }
    next();
};
exports.requirePasswordSet = requirePasswordSet;
const requireCompleteProfile = (req, res, next) => {
    if (!req.user?.isEmailVerified || !req.user?.isPasswordSet) {
        res.status(403).json({
            success: false,
            message: 'Complete profile setup required'
        });
        return;
    }
    next();
};
exports.requireCompleteProfile = requireCompleteProfile;
const requireRole = (allowedRoles) => {
    return (req, res, next) => {
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
exports.requireRole = requireRole;
exports.requireAdmin = (0, exports.requireRole)('admin');
exports.requireJudgeOrAdmin = (0, exports.requireRole)(['judge', 'admin']);
//# sourceMappingURL=auth.js.map