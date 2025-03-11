import jwt from 'jsonwebtoken';
import { logger } from '../config/logger.config.js';
import { createError } from '../utils/error.util.js';
import User from '../models/user.model.js';

/**
 * Middleware to authenticate requests using JWT
 */
export const protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(createError('Not authorized to access this route', 401));
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from token
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        return next(createError('User not found', 401));
      }

      if (!user.active) {
        return next(createError('User account is deactivated', 401));
      }

      req.user = user;
      next();
    } catch (error) {
      logger.error(`Token verification error: ${error.message}`);
      return next(createError('Not authorized to access this route', 401));
    }
  } catch (error) {
    logger.error(`Auth middleware error: ${error.message}`);
    return next(createError('Server Error', 500));
  }
};

/**
 * Middleware to check user roles
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(createError(`Role ${req.user.role} is not authorized to access this route`, 403));
    }
    next();
  };
};

/**
 * Middleware to validate same day group access
 */
export const validateDayGroup = async (req, res, next) => {
  try {
    const { role, dayGroup } = req.user;
    
    // Admin can access all groups
    if (role === 'admin') {
      return next();
    }

    // Check if the requested group matches user's group
    const requestedGroup = req.body.dayGroup || req.query.dayGroup;
    if (requestedGroup && requestedGroup !== dayGroup) {
      return next(createError('Access restricted to own day group', 403));
    }

    next();
  } catch (error) {
    logger.error(`Day group validation error: ${error.message}`);
    return next(createError('Server Error', 500));
  }
};

/**
 * Middleware to refresh token
 */
export const verifyRefreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return next(createError('Refresh token is required', 400));
    }

    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

      // Get user and check if refresh token exists
      const user = await User.findById(decoded.id);

      if (!user) {
        return next(createError('Invalid refresh token', 401));
      }

      const tokenExists = user.refreshTokens.some(t => t.token === refreshToken);

      if (!tokenExists) {
        return next(createError('Refresh token has been revoked', 401));
      }

      req.user = user;
      req.refreshToken = refreshToken;
      next();
    } catch (error) {
      logger.error(`Refresh token verification error: ${error.message}`);
      return next(createError('Invalid refresh token', 401));
    }
  } catch (error) {
    logger.error(`Refresh token middleware error: ${error.message}`);
    return next(createError('Server Error', 500));
  }
}; 