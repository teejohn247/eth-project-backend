const swaggerJsdoc = require('swagger-jsdoc');
const fs = require('fs');
const path = require('path');

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
        url: 'https://eth-project-backend-1086159474664.europe-west1.run.app',
        description: 'Production server (Google Cloud Run)'
      },
      {
        url: 'http://localhost:3001',
        description: 'Development server'
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
          required: ['email', 'password', 'confirmPassword'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address',
              example: 'john.doe@example.com'
            },
            password: {
              type: 'string',
              minLength: 6,
              description: 'New password (minimum 6 characters)',
              example: 'SecurePass123!'
            },
            confirmPassword: {
              type: 'string',
              minLength: 6,
              description: 'Confirm password (must match password)',
              example: 'SecurePass123!'
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
        MediaInfo: {
          type: 'object',
          properties: {
            profilePhoto: {
              type: 'string',
              description: 'Base64 encoded profile photo (data URL format)',
              example: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD...'
            },
            videoUpload: {
              type: 'string',
              description: 'Base64 encoded audition video (data URL format)',
              example: 'data:video/mp4;base64,AAAAIGZ0eXBpc29tAAACAGlzb21pc28y...'
            }
          }
        },
        TermsConditions: {
          type: 'object',
          required: ['rulesAcceptance', 'promotionalAcceptance', 'contestantSignature'],
          properties: {
            rulesAcceptance: {
              type: 'boolean',
              description: 'Must be true - acceptance of competition rules',
              example: true
            },
            promotionalAcceptance: {
              type: 'boolean',
              description: 'Must be true - acceptance of promotional terms',
              example: true
            },
            contestantSignature: {
              type: 'string',
              description: 'Base64 encoded contestant signature (data URL format)',
              example: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASw...'
            },
            guardianSignature: {
              type: 'string',
              description: 'Base64 encoded guardian signature (required for contestants under 16)',
              example: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASw...'
            }
          }
        },
        GroupInfo: {
          type: 'object',
          required: ['groupName', 'noOfGroupMembers', 'members'],
          properties: {
            groupName: {
              type: 'string',
              maxLength: 100,
              description: 'Name of the group',
              example: 'hjds'
            },
            noOfGroupMembers: {
              type: 'string',
              description: 'Number of group members (2-5)',
              example: '3'
            },
            members: {
              type: 'array',
              minItems: 2,
              maxItems: 5,
              description: 'Array of group members',
              items: {
                type: 'object',
                required: ['firstName', 'lastName', 'dateOfBirth', 'gender', 'tshirtSize'],
                properties: {
                  firstName: {
                    type: 'string',
                    minLength: 2,
                    maxLength: 50,
                    example: 'hsdjh'
                  },
                  lastName: {
                    type: 'string',
                    minLength: 2,
                    maxLength: 50,
                    example: 'dsjhhjs'
                  },
                  dateOfBirth: {
                    type: 'string',
                    format: 'date-time',
                    example: '2022-09-15T23:00:00.000Z'
                  },
                  gender: {
                    type: 'string',
                    enum: ['Male', 'Female'],
                    example: 'Male'
                  },
                  tshirtSize: {
                    type: 'string',
                    enum: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'xs', 's', 'm', 'l', 'xl', 'xxl'],
                    description: 'T-shirt size (case-insensitive)',
                    example: 'xl'
                  }
                }
              }
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

const specs = swaggerJsdoc(options);

// Write to file
const outputPath = path.join(__dirname, '..', 'swagger-output.json');
fs.writeFileSync(outputPath, JSON.stringify(specs, null, 2));

console.log('✅ Swagger documentation generated successfully at:', outputPath);
console.log('📊 Total paths found:', Object.keys(specs.paths || {}).length);
console.log('🏷️ Tags:', specs.tags?.map(tag => tag.name).join(', '));
