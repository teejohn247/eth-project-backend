"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Edo Talent Hunt API',
            version: '1.0.0',
            description: 'A comprehensive authentication API for Edo Talent Hunt with email verification, JWT authentication, and password management.',
            contact: {
                name: 'Edo Talent Hunt Team',
                email: 'tolu.ajuwon@aceall.io'
            },
            license: {
                name: 'MIT',
                url: 'https://opensource.org/licenses/MIT'
            }
        },
        servers: [
            {
                url: process.env.NODE_ENV === 'production'
                    ? 'https://eth-project-backend-1086159474664.europe-west1.run.app'
                    : 'http://localhost:3001',
                description: process.env.NODE_ENV === 'production' ? 'Production server (Google Cloud Run)' : 'Development server'
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'JWT Authorization header using the Bearer scheme'
                }
            },
            schemas: {
                User: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'string',
                            description: 'Unique user identifier',
                            example: '68c6b7dac7cd959cc9eea5a3'
                        },
                        firstName: {
                            type: 'string',
                            description: 'User first name',
                            example: 'John'
                        },
                        lastName: {
                            type: 'string',
                            description: 'User last name',
                            example: 'Doe'
                        },
                        email: {
                            type: 'string',
                            format: 'email',
                            description: 'User email address',
                            example: 'john.doe@example.com'
                        },
                        isEmailVerified: {
                            type: 'boolean',
                            description: 'Whether user email is verified',
                            example: true
                        },
                        isPasswordSet: {
                            type: 'boolean',
                            description: 'Whether user has set a password',
                            example: true
                        }
                    }
                },
                AuthResponse: {
                    type: 'object',
                    properties: {
                        success: {
                            type: 'boolean',
                            description: 'Operation success status'
                        },
                        message: {
                            type: 'string',
                            description: 'Response message'
                        },
                        data: {
                            type: 'object',
                            properties: {
                                token: {
                                    type: 'string',
                                    description: 'JWT authentication token'
                                },
                                user: {
                                    $ref: '#/components/schemas/User'
                                }
                            }
                        }
                    }
                },
                OTPResponse: {
                    type: 'object',
                    properties: {
                        success: {
                            type: 'boolean',
                            description: 'Operation success status'
                        },
                        message: {
                            type: 'string',
                            description: 'Response message'
                        },
                        data: {
                            type: 'object',
                            properties: {
                                email: {
                                    type: 'string',
                                    format: 'email',
                                    description: 'Email address where OTP was sent'
                                },
                                expiresAt: {
                                    type: 'string',
                                    format: 'date-time',
                                    description: 'OTP expiration timestamp'
                                }
                            }
                        }
                    }
                },
                ErrorResponse: {
                    type: 'object',
                    properties: {
                        success: {
                            type: 'boolean',
                            example: false
                        },
                        message: {
                            type: 'string',
                            description: 'Error message'
                        },
                        errors: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    field: {
                                        type: 'string'
                                    },
                                    message: {
                                        type: 'string'
                                    }
                                }
                            },
                            description: 'Validation errors (if applicable)'
                        }
                    }
                },
                RegisterRequest: {
                    type: 'object',
                    required: ['firstName', 'lastName', 'email'],
                    properties: {
                        firstName: {
                            type: 'string',
                            minLength: 2,
                            maxLength: 50,
                            description: 'User first name',
                            example: 'John'
                        },
                        lastName: {
                            type: 'string',
                            minLength: 2,
                            maxLength: 50,
                            description: 'User last name',
                            example: 'Doe'
                        },
                        email: {
                            type: 'string',
                            format: 'email',
                            description: 'User email address',
                            example: 'john.doe@example.com'
                        }
                    }
                },
                VerifyOTPRequest: {
                    type: 'object',
                    required: ['email', 'otp'],
                    properties: {
                        email: {
                            type: 'string',
                            format: 'email',
                            description: 'User email address',
                            example: 'john.doe@example.com'
                        },
                        otp: {
                            type: 'string',
                            minLength: 4,
                            maxLength: 6,
                            description: 'OTP code',
                            example: '1234'
                        }
                    }
                },
                SetPasswordRequest: {
                    type: 'object',
                    required: ['email', 'password'],
                    properties: {
                        email: {
                            type: 'string',
                            format: 'email',
                            description: 'User email address',
                            example: 'john.doe@example.com'
                        },
                        password: {
                            type: 'string',
                            minLength: 8,
                            description: 'User password (min 8 characters)',
                            example: 'SecurePass123!'
                        }
                    }
                },
                LoginRequest: {
                    type: 'object',
                    required: ['email', 'password'],
                    properties: {
                        email: {
                            type: 'string',
                            format: 'email',
                            description: 'User email address',
                            example: 'john.doe@example.com'
                        },
                        password: {
                            type: 'string',
                            description: 'User password',
                            example: 'SecurePass123!'
                        }
                    }
                },
                ForgotPasswordRequest: {
                    type: 'object',
                    required: ['email'],
                    properties: {
                        email: {
                            type: 'string',
                            format: 'email',
                            description: 'User email address',
                            example: 'john.doe@example.com'
                        }
                    }
                }
            }
        },
        tags: [
            {
                name: 'Health',
                description: 'API health check endpoints'
            },
            {
                name: 'Authentication',
                description: 'User authentication and authorization endpoints'
            },
            {
                name: 'User',
                description: 'User profile and management endpoints'
            },
            {
                name: 'Registration Steps',
                description: 'Multi-step talent registration process endpoints'
            },
            {
                name: 'Registration Management',
                description: 'Registration CRUD operations and management'
            },
            {
                name: 'Payment',
                description: 'Payment processing and transaction management'
            }
        ]
    },
    apis: [
        './src/routes/*.ts',
        './src/server.ts'
    ]
};
const specs = (0, swagger_jsdoc_1.default)(options);
exports.default = specs;
//# sourceMappingURL=swagger.js.map