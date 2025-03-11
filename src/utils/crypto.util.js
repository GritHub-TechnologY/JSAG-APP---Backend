import crypto from 'crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { config } from '../config/config.js';

/**
 * Cryptography utility functions
 */
class CryptoUtil {
  /**
   * Hash password
   */
  static async hashPassword(password) {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }

  /**
   * Compare password with hash
   */
  static async comparePassword(password, hash) {
    return bcrypt.compare(password, hash);
  }

  /**
   * Generate JWT token
   */
  static generateToken(payload, expiresIn = '1d') {
    return jwt.sign(payload, config.jwt.secret, {
      expiresIn,
      algorithm: 'HS256'
    });
  }

  /**
   * Verify JWT token
   */
  static verifyToken(token) {
    try {
      return jwt.verify(token, config.jwt.secret);
    } catch (error) {
      return null;
    }
  }

  /**
   * Generate random string
   */
  static generateRandomString(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Generate reset token
   */
  static generateResetToken() {
    return {
      token: this.generateRandomString(32),
      expires: new Date(Date.now() + 3600000) // 1 hour
    };
  }

  /**
   * Generate verification code
   */
  static generateVerificationCode(length = 6) {
    return Math.random().toString().substr(2, length);
  }

  /**
   * Hash data with SHA256
   */
  static hashSHA256(data) {
    return crypto
      .createHash('sha256')
      .update(data)
      .digest('hex');
  }

  /**
   * Encrypt data
   */
  static encrypt(data, key = config.crypto.key) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key), iv);
    let encrypted = cipher.update(data);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
  }

  /**
   * Decrypt data
   */
  static decrypt(data, key = config.crypto.key) {
    const [ivHex, encryptedHex] = data.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const encrypted = Buffer.from(encryptedHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key), iv);
    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  }

  /**
   * Generate HMAC
   */
  static generateHMAC(data, key = config.crypto.key) {
    return crypto
      .createHmac('sha256', key)
      .update(data)
      .digest('hex');
  }

  /**
   * Generate secure filename
   */
  static generateSecureFilename(originalName) {
    const timestamp = Date.now();
    const random = this.generateRandomString(8);
    const extension = originalName.split('.').pop();
    return `${timestamp}-${random}.${extension}`;
  }

  /**
   * Generate API key
   */
  static generateApiKey() {
    const prefix = 'ak';
    const timestamp = Date.now().toString(36);
    const random = this.generateRandomString(16);
    return `${prefix}_${timestamp}_${random}`;
  }

  /**
   * Hash API key
   */
  static hashApiKey(apiKey) {
    return this.hashSHA256(apiKey);
  }

  /**
   * Generate session ID
   */
  static generateSessionId() {
    return `sess_${this.generateRandomString(32)}`;
  }

  /**
   * Generate refresh token
   */
  static generateRefreshToken() {
    return {
      token: this.generateRandomString(64),
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    };
  }

  /**
   * Generate secure password
   */
  static generateSecurePassword() {
    const length = 16;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
    let password = '';
    for (let i = 0; i < length; i++) {
      const randomIndex = crypto.randomInt(0, charset.length);
      password += charset[randomIndex];
    }
    return password;
  }

  /**
   * Validate password strength
   */
  static validatePasswordStrength(password) {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChars = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);

    return {
      isValid: password.length >= minLength && hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChars,
      errors: {
        length: password.length < minLength,
        upperCase: !hasUpperCase,
        lowerCase: !hasLowerCase,
        numbers: !hasNumbers,
        specialChars: !hasSpecialChars
      }
    };
  }

  /**
   * Generate OTP
   */
  static generateOTP(length = 6) {
    const digits = '0123456789';
    let otp = '';
    for (let i = 0; i < length; i++) {
      const randomIndex = crypto.randomInt(0, digits.length);
      otp += digits[randomIndex];
    }
    return otp;
  }

  /**
   * Verify OTP
   */
  static verifyOTP(otp, storedOTP, expiryTime) {
    if (!storedOTP || !expiryTime) return false;
    if (Date.now() > expiryTime) return false;
    return otp === storedOTP;
  }
}

export default CryptoUtil; 