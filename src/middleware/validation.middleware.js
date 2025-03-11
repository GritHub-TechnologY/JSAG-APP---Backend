import { body, param, query, validationResult } from 'express-validator';
import { createError, formatValidationErrors } from '../utils/error.util.js';

/**
 * Middleware to validate request data
 */
export const validateRequest = (validations) => {
  return async (req, res, next) => {
    // Run all validations
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(createError('Validation failed', 400, formatValidationErrors(errors)));
    }

    next();
  };
};

/**
 * Common validation chains
 */
const commonValidations = {
  // User validations
  name: body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ max: 50 })
    .withMessage('Name cannot be more than 50 characters'),

  email: body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email'),

  password: body('password')
    .trim()
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),

  phoneNumber: body('phoneNumber')
    .trim()
    .notEmpty()
    .withMessage('Phone number is required')
    .matches(/^\+?[\d\s-]+$/)
    .withMessage('Please provide a valid phone number'),

  dayGroup: body('dayGroup')
    .trim()
    .notEmpty()
    .withMessage('Day group is required')
    .isIn(['A', 'B', 'C', 'D'])
    .withMessage('Invalid day group'),

  department: body('department')
    .trim()
    .notEmpty()
    .withMessage('Department is required'),

  // Date validations
  date: body('date')
    .notEmpty()
    .withMessage('Date is required')
    .isISO8601()
    .withMessage('Invalid date format'),

  startDate: query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid start date format'),

  endDate: query('endDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid end date format'),

  // ID validations
  userId: param('userId')
    .notEmpty()
    .withMessage('User ID is required')
    .isMongoId()
    .withMessage('Invalid user ID format'),

  // Token validations
  refreshToken: body('refreshToken')
    .notEmpty()
    .withMessage('Refresh token is required'),

  resetToken: param('token')
    .notEmpty()
    .withMessage('Reset token is required')
};

/**
 * Validation chains for specific routes
 */
export const validations = {
  register: [
    commonValidations.name,
    commonValidations.email,
    commonValidations.password,
    commonValidations.phoneNumber,
    commonValidations.dayGroup,
    commonValidations.department
  ],

  login: [
    commonValidations.email,
    commonValidations.password
  ],

  refresh: [
    commonValidations.refreshToken
  ],

  forgotPassword: [
    commonValidations.email
  ],

  resetPassword: [
    commonValidations.resetToken,
    commonValidations.password
  ],

  changePassword: [
    body('currentPassword')
      .notEmpty()
      .withMessage('Current password is required'),
    body('newPassword')
      .notEmpty()
      .withMessage('New password is required')
      .isLength({ min: 6 })
      .withMessage('New password must be at least 6 characters')
  ],

  dateRange: [
    commonValidations.startDate,
    commonValidations.endDate,
    query('startDate').custom((startDate, { req }) => {
      if (startDate && req.query.endDate && startDate > req.query.endDate) {
        throw new Error('Start date must be before end date');
      }
      return true;
    })
  ]
};

// Export validation middleware functions
export const validateDateRange = validateRequest(validations.dateRange);
export const validateRegister = validateRequest(validations.register);
export const validateLogin = validateRequest(validations.login);
export const validateRefresh = validateRequest(validations.refresh);
export const validateForgotPassword = validateRequest(validations.forgotPassword);
export const validateResetPassword = validateRequest(validations.resetPassword);
export const validateChangePassword = validateRequest(validations.changePassword);

// Helper function to validate MongoDB ObjectId
export const isValidObjectId = (value) => {
  return /^[0-9a-fA-F]{24}$/.test(value);
};

export const validateDate = (value) => {
  const date = new Date(value);
  if (isNaN(date.getTime())) {
    throw new Error('Invalid date format');
  }
  
  // Can't be in the future
  if (date > new Date()) {
    throw new Error('Date cannot be in the future');
  }
  
  return true;
};

export const validatePassword = (value) => {
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  if (!regex.test(value)) {
    throw new Error(
      'Password must be at least 8 characters long and contain at least one uppercase letter, ' +
      'one lowercase letter, one number and one special character'
    );
  }
  return true;
};

export const validateEmail = (value) => {
  const regex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
  if (!regex.test(value)) {
    throw new Error('Invalid email format');
  }
  return true;
};

export const validateDayGroup = (value) => {
  const validGroups = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  if (!validGroups.includes(value)) {
    throw new Error('Invalid day group');
  }
  return true;
};

export const validateRole = (value) => {
  const validRoles = ['admin', 'leader', 'member'];
  if (!validRoles.includes(value)) {
    throw new Error('Invalid role');
  }
  return true;
};

export const validateStatus = (value) => {
  const validStatuses = ['present', 'absent', 'system-absent'];
  if (!validStatuses.includes(value)) {
    throw new Error('Invalid status');
  }
  return true;
}; 