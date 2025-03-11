# CryptoUtil Documentation

The `CryptoUtil` class provides a comprehensive set of cryptographic utilities for secure data handling, authentication, and token management.

## Table of Contents
- [Password Management](#password-management)
- [Token Management](#token-management)
- [Data Encryption](#data-encryption)
- [Security Utilities](#security-utilities)
- [OTP Management](#otp-management)

## Password Management

### Password Hashing and Verification
```javascript
// Hash a password
const password = 'MySecurePassword123!';
const hashedPassword = await CryptoUtil.hashPassword(password);

// Verify password
const isMatch = await CryptoUtil.comparePassword(password, hashedPassword);
// Returns: true
```

### Password Generation and Validation
```javascript
// Generate secure password
const securePassword = CryptoUtil.generateSecurePassword();
// Returns: Complex password with uppercase, lowercase, numbers, and special chars

// Validate password strength
const validation = CryptoUtil.validatePasswordStrength('Password123!');
/*
{
  isValid: true,
  errors: {
    length: false,
    upperCase: false,
    lowerCase: false,
    numbers: false,
    specialChars: false
  }
}
*/
```

## Token Management

### JWT Tokens
```javascript
// Generate JWT token
const payload = { userId: '123', role: 'admin' };
const token = CryptoUtil.generateToken(payload, '1d');

// Verify JWT token
const decoded = CryptoUtil.verifyToken(token);
// Returns: { userId: '123', role: 'admin', iat: ..., exp: ... }
```

### Reset and Refresh Tokens
```javascript
// Generate password reset token
const resetToken = CryptoUtil.generateResetToken();
/*
{
  token: '1234abcd...',
  expires: Date // 1 hour from now
}
*/

// Generate refresh token
const refreshToken = CryptoUtil.generateRefreshToken();
/*
{
  token: '5678efgh...',
  expires: Date // 7 days from now
}
*/
```

### API Keys
```javascript
// Generate API key
const apiKey = CryptoUtil.generateApiKey();
// Returns: 'ak_1234abcd_5678efgh'

// Hash API key for storage
const hashedApiKey = CryptoUtil.hashApiKey(apiKey);
```

## Data Encryption

### Symmetric Encryption
```javascript
// Encrypt data
const sensitiveData = 'My secret data';
const encrypted = CryptoUtil.encrypt(sensitiveData);
// Returns: 'iv:encrypted'

// Decrypt data
const decrypted = CryptoUtil.decrypt(encrypted);
// Returns: 'My secret data'
```

### Hash Functions
```javascript
// Generate SHA256 hash
const data = 'Hash this data';
const hash = CryptoUtil.hashSHA256(data);

// Generate HMAC
const hmac = CryptoUtil.generateHMAC(data);
```

## Security Utilities

### Random String Generation
```javascript
// Generate random string
const random = CryptoUtil.generateRandomString(32);

// Generate secure filename
const filename = 'user-upload.pdf';
const secureFilename = CryptoUtil.generateSecureFilename(filename);
// Returns: '1234567890-abcdef12.pdf'

// Generate session ID
const sessionId = CryptoUtil.generateSessionId();
// Returns: 'sess_1234abcd...'
```

### Verification Codes
```javascript
// Generate verification code
const verificationCode = CryptoUtil.generateVerificationCode(6);
// Returns: '123456'
```

## OTP Management

### OTP Generation and Verification
```javascript
// Generate OTP
const otp = CryptoUtil.generateOTP(6);
// Returns: '123456'

// Verify OTP
const storedOTP = '123456';
const expiryTime = Date.now() + 300000; // 5 minutes
const isValid = CryptoUtil.verifyOTP('123456', storedOTP, expiryTime);
```

## Best Practices

1. Password Security
   - Always hash passwords before storage
   - Use strong password validation rules
   - Never store plain text passwords

2. Token Management
   - Use appropriate token expiration times
   - Implement token refresh mechanisms
   - Validate tokens on every request

3. Data Encryption
   - Use encryption for sensitive data
   - Securely manage encryption keys
   - Implement key rotation policies

4. General Security
   - Use secure random generation
   - Implement rate limiting
   - Follow security best practices

## Error Handling

The utility methods handle various error scenarios:
- Invalid input validation
- Token verification failures
- Encryption/decryption errors
- Password validation failures

Example error handling:
```javascript
try {
  const token = CryptoUtil.verifyToken(invalidToken);
  if (!token) {
    // Handle invalid token
  }
} catch (error) {
  // Handle verification error
}
```

## Security Considerations

1. Key Management
   - Secure storage of encryption keys
   - Regular key rotation
   - Environment-based key configuration

2. Token Security
   - Short expiration times
   - Secure token storage
   - Token revocation mechanism

3. Password Security
   - Strong password policies
   - Brute force protection
   - Regular password rotation 