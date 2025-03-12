import jwt from 'jsonwebtoken';
import { logger, auditLogger } from '../config/logger.config.js';
import User from '../models/user.model.js';

class AuthService {
  /**
   * Generate JWT tokens for authentication
   */
  static async generateTokens(user, userAgent, ipAddress) {
    const payload = {
      id: user._id,
      role: user.role,
      dayGroup: user.dayGroup
    };

    const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE
    });

    const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
      expiresIn: process.env.JWT_REFRESH_EXPIRE
    });

    // Calculate refresh token expiry
    const refreshExpires = new Date();
    refreshExpires.setDate(refreshExpires.getDate() + 7); // 7 days from now

    // Store refresh token with user
    await user.addRefreshToken(refreshToken, refreshExpires, userAgent, ipAddress);

    // Clean up expired tokens
    await user.cleanRefreshTokens();

    return { accessToken, refreshToken };
  }

  /**
   * Register a new user
   */
  static async registerUser(userData, userAgent, ipAddress) {
    const { email } = userData;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new Error('User already exists with this email');
    }

    // Create new user
    const user = await User.create(userData);

    // Generate tokens
    const tokens = await this.generateTokens(user, userAgent, ipAddress);

    // Log successful registration
    auditLogger.info('New user registered', {
      userId: user._id,
      email: user.email,
      role: user.role,
      ipAddress
    });

    return {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        dayGroup: user.dayGroup,
        department: user.department
      },
      ...tokens
    };
  }

  /**
   * Authenticate user with email and password
   */
  static async authenticateUser(email, password, userAgent, ipAddress) {
    const user = await User.findOne({ email }).select('+password');

    if (!user || !user.active) {
      throw new Error('Invalid credentials or account deactivated');
    }

    const isPasswordValid = await user.matchPassword(password);
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    // Generate tokens
    const tokens = await this.generateTokens(user, userAgent, ipAddress);

    // Log successful login
    auditLogger.info('User login successful', {
      userId: user._id,
      email: user.email,
      role: user.role,
      ipAddress
    });

    return {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        dayGroup: user.dayGroup,
        department: user.department
      },
      ...tokens
    };
  }

  /**
   * Refresh access token using refresh token
   */
  static async refreshAccessToken(refreshToken, userAgent, ipAddress) {
    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

      // Get user and check if refresh token exists
      const user = await User.findById(decoded.id);
      if (!user || !user.active) {
        throw new Error('User not found or account deactivated');
      }

      const tokenExists = user.refreshTokens.some(t => t.token === refreshToken);
      if (!tokenExists) {
        throw new Error('Invalid refresh token');
      }

      // Remove old refresh token
      await user.removeRefreshToken(refreshToken);

      // Generate new tokens
      return await this.generateTokens(user, userAgent, ipAddress);
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  /**
   * Logout user by invalidating refresh token
   */
  static async logout(refreshToken) {
    try {
      // Find user and remove refresh token
      const decoded = jwt.decode(refreshToken);
      if (decoded?.id) {
        const user = await User.findById(decoded.id);
        if (user) {
          await user.removeRefreshToken(refreshToken);
          
          // Log successful logout
          auditLogger.info('User logout successful', {
            userId: user._id,
            email: user.email
          });
        }
      }

      return true;
    } catch (error) {
      logger.error('Logout error:', error);
      return false;
    }
  }

  /**
   * Verify access token
   */
  static verifyAccessToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      throw new Error('Invalid access token');
    }
  }
}

export default AuthService; 