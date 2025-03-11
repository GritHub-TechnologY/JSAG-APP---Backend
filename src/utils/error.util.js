/**
 * Custom error class for API errors
 */
export class APIError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Create an error with status code and message
 */
export const createError = (message, statusCode = 500) => {
  return new APIError(message, statusCode);
};

/**
 * Error codes for common scenarios
 */
export const ErrorCodes = {
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  BAD_REQUEST: 400,
  VALIDATION_ERROR: 422,
  INTERNAL_SERVER: 500,
  SERVICE_UNAVAILABLE: 503,
  CONFLICT: 409
};

/**
 * Common error messages
 */
export const ErrorMessages = {
  UNAUTHORIZED: 'You are not authorized to access this resource',
  FORBIDDEN: 'You do not have permission to perform this action',
  NOT_FOUND: 'Resource not found',
  BAD_REQUEST: 'Invalid request',
  VALIDATION_ERROR: 'Validation error',
  INTERNAL_SERVER: 'Internal server error',
  SERVICE_UNAVAILABLE: 'Service temporarily unavailable',
  INVALID_TOKEN: 'Invalid or expired token',
  MISSING_TOKEN: 'No authentication token provided',
  USER_NOT_FOUND: 'User not found',
  INVALID_CREDENTIALS: 'Invalid email or password',
  EMAIL_EXISTS: 'Email already exists',
  INVALID_PASSWORD: 'Invalid password format',
  INVALID_EMAIL: 'Invalid email format',
  INVALID_DATE: 'Invalid date format',
  INVALID_DATE_RANGE: 'Invalid date range',
  ATTENDANCE_EXISTS: 'Attendance record already exists for this date',
  FUTURE_DATE: 'Cannot mark attendance for future dates',
  INVALID_STATUS: 'Invalid attendance status'
};

/**
 * Handle async errors in route handlers
 */
export const catchAsync = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Format validation errors from express-validator
 */
export const formatValidationErrors = (errors) => {
  return errors.array().map(error => ({
    field: error.param,
    message: error.msg
  }));
};

/**
 * Handle database operation errors
 */
export const handleDBError = (error) => {
  if (error.code === 11000) {
    const field = Object.keys(error.keyPattern)[0];
    return createError(`Duplicate value for ${field}`, ErrorCodes.CONFLICT);
  }
  return createError(error.message, ErrorCodes.INTERNAL_SERVER);
};

/**
 * Check if error is operational (known) or programming error
 */
export const isOperationalError = (error) => {
  return error.isOperational;
};

/**
 * Format error response
 */
export const formatErrorResponse = (error) => {
  return {
    status: error.status || 'error',
    message: error.message,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  };
}; 