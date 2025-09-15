# Edo Talent Hunt Backend API

A robust Node.js backend API built with TypeScript and MongoDB for the Edo Talent Hunt authentication system.

## Features

- ✅ User Registration with Email Verification
- ✅ OTP-based Email Verification
- ✅ Secure Password Setup
- ✅ User Login with JWT Authentication
- ✅ Forgot Password with OTP Reset
- ✅ Rate Limiting & Security Middleware
- ✅ Input Validation
- ✅ Email Service Integration
- ✅ MongoDB Integration with Mongoose
- ✅ TypeScript Support

## Tech Stack

- **Runtime**: Node.js
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (JSON Web Tokens)
- **Email**: Nodemailer
- **Validation**: Joi
- **Security**: Helmet, CORS, Rate Limiting
- **Password Hashing**: bcryptjs

## API Endpoints

### Authentication Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/register` | Register new user |
| POST | `/api/v1/auth/verify-otp` | Verify email with OTP |
| POST | `/api/v1/auth/set-password` | Set password after verification |
| POST | `/api/v1/auth/login` | User login |
| POST | `/api/v1/auth/forgot-password` | Request password reset |
| POST | `/api/v1/auth/verify-reset-otp` | Verify password reset OTP |
| POST | `/api/v1/auth/reset-password` | Reset password |
| POST | `/api/v1/auth/resend-otp` | Resend OTP |

### User Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/user/profile` | Get user profile (Protected) |
| GET | `/api/v1/user/dashboard` | Access dashboard (Protected) |

### System Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/health` | Health check |
| GET | `/` | API documentation |

## Installation & Setup

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or cloud)
- Email service credentials (Gmail, SendGrid, etc.)

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Configuration

Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/edo-talent-hunt

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d

# Email Configuration (Gmail example)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=noreply@edotalenthunt.com

# OTP Configuration
OTP_EXPIRES_IN=10
OTP_LENGTH=4

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 3. Build & Run

```bash
# Development mode
npm run dev

# Production build
npm run build
npm start
```

## Authentication Flow

### 1. User Registration
```
POST /api/v1/auth/register
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com"
}
```

### 2. Email Verification
```
POST /api/v1/auth/verify-otp
{
  "email": "john@example.com",
  "otp": "1234"
}
```

### 3. Set Password
```
POST /api/v1/auth/set-password
{
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

### 4. Login
```
POST /api/v1/auth/login
{
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

### 5. Forgot Password
```
POST /api/v1/auth/forgot-password
{
  "email": "john@example.com"
}

POST /api/v1/auth/verify-reset-otp
{
  "email": "john@example.com",
  "otp": "5678"
}

POST /api/v1/auth/reset-password
{
  "email": "john@example.com",
  "password": "NewSecurePass123"
}
```

## Security Features

- **Rate Limiting**: Prevents brute force attacks
- **Input Validation**: Joi schema validation
- **Password Hashing**: bcryptjs with salt rounds
- **JWT Authentication**: Secure token-based auth
- **CORS Protection**: Configurable cross-origin requests
- **Helmet Security**: Security headers
- **OTP Expiration**: Time-limited verification codes

## Email Configuration

### Gmail Setup
1. Enable 2-factor authentication
2. Generate an App Password
3. Use the App Password in `EMAIL_PASS`

### Other Providers
Update the `EMAIL_HOST` and `EMAIL_PORT` for your provider:
- **SendGrid**: smtp.sendgrid.net:587
- **Mailgun**: smtp.mailgun.org:587
- **Outlook**: smtp-mail.outlook.com:587

## Database Schema

### User Model
```typescript
{
  firstName: string,
  lastName: string,
  email: string (unique),
  password: string (hashed),
  isEmailVerified: boolean,
  isPasswordSet: boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### OTP Model
```typescript
{
  email: string,
  otp: string,
  type: 'email_verification' | 'password_reset',
  expiresAt: Date,
  isUsed: boolean,
  createdAt: Date
}
```

## Error Handling

The API returns consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    {
      "field": "email",
      "message": "Email is required"
    }
  ]
}
```

## Rate Limits

- **General API**: 100 requests per 15 minutes
- **Authentication**: 10 requests per 15 minutes
- **OTP Requests**: 3 requests per 5 minutes
- **Password Reset**: 5 requests per hour

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build

# Run tests
npm test
```

## Production Deployment

1. Set `NODE_ENV=production`
2. Use a strong `JWT_SECRET`
3. Configure production MongoDB URI
4. Set up proper email service
5. Configure CORS for your frontend domain
6. Use HTTPS in production
7. Set up monitoring and logging

## License

MIT License - see LICENSE file for details.
