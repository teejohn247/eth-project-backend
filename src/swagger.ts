import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
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
              example: '{userId}'
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
            role: {
              type: 'string',
              description: 'User role in the system',
              enum: ['contestant', 'admin', 'judge'],
              example: 'contestant'
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
        },
        Ticket: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'Ticket ID'
            },
            ticketType: {
              type: 'string',
              enum: ['regular', 'vip', 'table_of_5', 'table_of_10'],
              description: 'Type of ticket'
            },
            name: {
              type: 'string',
              description: 'Ticket name'
            },
            description: {
              type: 'string',
              description: 'Ticket description'
            },
            price: {
              type: 'number',
              description: 'Ticket price'
            },
            currency: {
              type: 'string',
              default: 'NGN',
              description: 'Currency code'
            },
            isActive: {
              type: 'boolean',
              description: 'Whether ticket is available for purchase'
            },
            availableQuantity: {
              type: 'number',
              description: 'Available ticket quantity (null if unlimited)'
            },
            soldQuantity: {
              type: 'number',
              description: 'Number of tickets sold'
            }
          }
        },
        TicketPurchase: {
          type: 'object',
          properties: {
            purchaseReference: {
              type: 'string',
              description: 'Unique purchase reference'
            },
            firstName: {
              type: 'string',
              description: 'Purchaser first name'
            },
            lastName: {
              type: 'string',
              description: 'Purchaser last name'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Purchaser email'
            },
            phone: {
              type: 'string',
              description: 'Purchaser phone number'
            },
            tickets: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  ticketType: {
                    type: 'string',
                    enum: ['regular', 'vip', 'vvip']
                  },
                  quantity: {
                    type: 'number'
                  },
                  unitPrice: {
                    type: 'number'
                  },
                  totalPrice: {
                    type: 'number'
                  }
                }
              }
            },
            totalAmount: {
              type: 'number',
              description: 'Total purchase amount'
            },
            currency: {
              type: 'string',
              default: 'NGN'
            },
            paymentStatus: {
              type: 'string',
              enum: ['pending', 'processing', 'completed', 'failed', 'refunded']
            },
            paymentReference: {
              type: 'string',
              description: 'Payment transaction reference'
            },
            ticketNumbers: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Generated ticket numbers (available after payment)'
            },
            ticketSent: {
              type: 'boolean',
              description: 'Whether ticket email was sent'
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
        name: 'Bulk Registration',
        description: 'Bulk registration management endpoints for purchasing multiple slots'
      },
      {
        name: 'Payment',
        description: 'Payment processing and transaction management'
      },
      {
        name: 'Locations',
        description: 'Nigerian states and LGAs location data endpoints'
      },
        {
          name: 'Admin',
          description: 'Administrative endpoints for managing users, registrations, and transactions (Admin only)'
        },
        {
          name: 'Complaints',
          description: 'Support complaint management endpoints for users and admins'
        },
        {
          name: 'Tickets',
          description: 'Event ticket purchase and management endpoints'
        }
    ]
  },
  apis: [
    './src/routes/*.ts',
    './src/server.ts'
  ]
};

const specs = swaggerJsdoc(options);
export default specs;
