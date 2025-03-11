# Authentication API

## Overview

The Authentication API provides endpoints for user registration, login, token management, and password recovery.

## Endpoints

### Register User

```http
POST /api/auth/register
Content-Type: application/json
```

Register a new user in the system.

#### Request Body
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "dayGroup": "Monday",
  "role": "member"
}
```

#### Response
```json
{
  "status": "success",
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com",
      "dayGroup": "Monday",
      "role": "member",
      "createdAt": "2024-03-15T09:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### Login

```http
POST /api/auth/login
Content-Type: application/json
```

Authenticate a user and receive access tokens.

#### Request Body
```json
{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

#### Response
```json
{
  "status": "success",
  "message": "Login successful",
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "member"
    },
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### Refresh Token

```http
POST /api/auth/refresh
Content-Type: application/json
```

Get a new access token using a refresh token.

#### Request Body
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

#### Response
```json
{
  "status": "success",
  "message": "Token refreshed successfully",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### Logout

```http
POST /api/auth/logout
Authorization: Bearer <token>
```

Invalidate the current access token.

#### Response
```json
{
  "status": "success",
  "message": "Logged out successfully"
}
```

### Forgot Password

```http
POST /api/auth/forgot-password
Content-Type: application/json
```

Request a password reset link.

#### Request Body
```json
{
  "email": "john@example.com"
}
```

#### Response
```json
{
  "status": "success",
  "message": "Password reset instructions sent to email"
}
```

### Reset Password

```http
POST /api/auth/reset-password
Content-Type: application/json
```

Reset password using reset token.

#### Request Body
```json
{
  "token": "reset-token",
  "password": "NewSecurePass123!",
  "confirmPassword": "NewSecurePass123!"
}
```

#### Response
```json
{
  "status": "success",
  "message": "Password reset successful"
}
```

### Change Password

```http
POST /api/auth/change-password
Authorization: Bearer <token>
Content-Type: application/json
```

Change password for authenticated user.

#### Request Body
```json
{
  "currentPassword": "SecurePass123!",
  "newPassword": "NewSecurePass123!",
  "confirmPassword": "NewSecurePass123!"
}
```

#### Response
```json
{
  "status": "success",
  "message": "Password changed successfully"
}
```

## Validation Rules

### Password Requirements
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

### Email Requirements
- Valid email format
- Unique in the system

### Name Requirements
- 2-50 characters
- Alphanumeric with spaces

## Error Responses

### Invalid Credentials
```json
{
  "status": "error",
  "message": "Invalid email or password",
  "errors": null
}
```

### Validation Error
```json
{
  "status": "error",
  "message": "Validation Error",
  "errors": {
    "password": "Password must contain at least one uppercase letter"
  }
}
```

### Email Already Exists
```json
{
  "status": "error",
  "message": "Email already registered",
  "errors": {
    "email": "Email is already in use"
  }
}
```

### Invalid Token
```json
{
  "status": "error",
  "message": "Invalid or expired token",
  "errors": null
}
```

## Security Measures

1. **Password Security**
   - Passwords are hashed using bcrypt
   - Salt rounds: 10
   - No plain text storage

2. **Token Security**
   - JWT tokens with HS256 algorithm
   - Access token expiry: 1 day
   - Refresh token expiry: 7 days
   - Token rotation on refresh

3. **Rate Limiting**
   - Login: 5 attempts per 15 minutes
   - Password reset: 3 attempts per hour
   - Token refresh: 10 attempts per minute

4. **Session Management**
   - Token blacklisting on logout
   - Concurrent session limits
   - Device tracking (optional)

## Examples

### Register with Role
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "Team Leader",
  "email": "leader@example.com",
  "password": "SecurePass123!",
  "dayGroup": "Monday",
  "role": "leader"
}
```

### Login with Remember Me
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass123!",
  "rememberMe": true
}
```

### Refresh with Device Info
```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "deviceId": "device-uuid",
  "deviceInfo": {
    "type": "browser",
    "name": "Chrome",
    "version": "120.0.0"
  }
}
```

## Best Practices

1. **Token Management**
   - Store tokens securely
   - Clear tokens on logout
   - Implement token refresh
   - Handle token expiration

2. **Error Handling**
   - Use appropriate status codes
   - Provide clear error messages
   - Validate input thoroughly
   - Log security events

3. **Security**
   - Use HTTPS only
   - Implement CORS properly
   - Monitor failed attempts
   - Regular security audits 