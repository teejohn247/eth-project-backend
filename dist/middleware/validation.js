"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = exports.resendOTPSchema = exports.forgotPasswordSchema = exports.setPasswordSchema = exports.verifyOTPSchema = exports.loginSchema = exports.registerSchema = void 0;
const joi_1 = __importDefault(require("joi"));
exports.registerSchema = joi_1.default.object({
    firstName: joi_1.default.string()
        .trim()
        .min(2)
        .max(50)
        .pattern(/^[a-zA-Z\s]+$/)
        .required()
        .messages({
        'string.empty': 'First name is required',
        'string.min': 'First name must be at least 2 characters long',
        'string.max': 'First name cannot exceed 50 characters',
        'string.pattern.base': 'First name can only contain letters and spaces'
    }),
    lastName: joi_1.default.string()
        .trim()
        .min(2)
        .max(50)
        .pattern(/^[a-zA-Z\s]+$/)
        .required()
        .messages({
        'string.empty': 'Last name is required',
        'string.min': 'Last name must be at least 2 characters long',
        'string.max': 'Last name cannot exceed 50 characters',
        'string.pattern.base': 'Last name can only contain letters and spaces'
    }),
    email: joi_1.default.string()
        .email()
        .lowercase()
        .trim()
        .required()
        .messages({
        'string.empty': 'Email is required',
        'string.email': 'Please enter a valid email address'
    })
});
exports.loginSchema = joi_1.default.object({
    email: joi_1.default.string()
        .email()
        .lowercase()
        .trim()
        .required()
        .messages({
        'string.empty': 'Email is required',
        'string.email': 'Please enter a valid email address'
    }),
    password: joi_1.default.string()
        .min(6)
        .required()
        .messages({
        'string.empty': 'Password is required',
        'string.min': 'Password must be at least 6 characters long'
    })
});
exports.verifyOTPSchema = joi_1.default.object({
    email: joi_1.default.string()
        .email()
        .lowercase()
        .trim()
        .required()
        .messages({
        'string.empty': 'Email is required',
        'string.email': 'Please enter a valid email address'
    }),
    otp: joi_1.default.string()
        .length(4)
        .pattern(/^\d{4}$/)
        .required()
        .messages({
        'string.empty': 'OTP is required',
        'string.length': 'OTP must be exactly 4 digits',
        'string.pattern.base': 'OTP must contain only numbers'
    })
});
exports.setPasswordSchema = joi_1.default.object({
    email: joi_1.default.string()
        .email()
        .lowercase()
        .trim()
        .required()
        .messages({
        'string.empty': 'Email is required',
        'string.email': 'Please enter a valid email address'
    }),
    password: joi_1.default.string()
        .min(6)
        .max(128)
        .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .required()
        .messages({
        'string.empty': 'Password is required',
        'string.min': 'Password must be at least 6 characters long',
        'string.max': 'Password cannot exceed 128 characters',
        'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    })
});
exports.forgotPasswordSchema = joi_1.default.object({
    email: joi_1.default.string()
        .email()
        .lowercase()
        .trim()
        .required()
        .messages({
        'string.empty': 'Email is required',
        'string.email': 'Please enter a valid email address'
    })
});
exports.resendOTPSchema = joi_1.default.object({
    email: joi_1.default.string()
        .email()
        .lowercase()
        .trim()
        .required()
        .messages({
        'string.empty': 'Email is required',
        'string.email': 'Please enter a valid email address'
    })
});
const validate = (schema) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.body, {
            abortEarly: false,
            stripUnknown: true
        });
        if (error) {
            const errors = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message
            }));
            res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors
            });
            return;
        }
        req.body = value;
        next();
    };
};
exports.validate = validate;
//# sourceMappingURL=validation.js.map