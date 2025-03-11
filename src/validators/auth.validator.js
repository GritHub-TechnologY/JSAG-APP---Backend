import Joi from 'joi';

/**
 * Authentication validators
 */
class AuthValidator {
  /**
   * Validate registration data
   */
  static validateRegistration(data) {
    const schema = Joi.object({
      name: Joi.string().min(2).max(50).required(),
      email: Joi.string().email().required(),
      password: Joi.string()
        .min(8)
        .max(50)
        .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
        .required()
        .messages({
          'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character'
        }),
      role: Joi.string().valid('admin', 'leader', 'member').default('member'),
      dayGroup: Joi.string().valid('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday').required()
    });

    return schema.validate(data, { abortEarly: false });
  }

  /**
   * Validate login data
   */
  static validateLogin(data) {
    const schema = Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().required()
    });

    return schema.validate(data, { abortEarly: false });
  }

  /**
   * Validate password reset request
   */
  static validateResetRequest(data) {
    const schema = Joi.object({
      email: Joi.string().email().required()
    });

    return schema.validate(data, { abortEarly: false });
  }

  /**
   * Validate password reset
   */
  static validatePasswordReset(data) {
    const schema = Joi.object({
      token: Joi.string().required(),
      password: Joi.string()
        .min(8)
        .max(50)
        .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
        .required()
        .messages({
          'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character'
        }),
      confirmPassword: Joi.string()
        .valid(Joi.ref('password'))
        .required()
        .messages({
          'any.only': 'Passwords do not match'
        })
    });

    return schema.validate(data, { abortEarly: false });
  }

  /**
   * Validate password change
   */
  static validatePasswordChange(data) {
    const schema = Joi.object({
      currentPassword: Joi.string().required(),
      newPassword: Joi.string()
        .min(8)
        .max(50)
        .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
        .required()
        .messages({
          'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character'
        }),
      confirmPassword: Joi.string()
        .valid(Joi.ref('newPassword'))
        .required()
        .messages({
          'any.only': 'Passwords do not match'
        })
    });

    return schema.validate(data, { abortEarly: false });
  }

  /**
   * Format validation errors
   */
  static formatErrors(error) {
    if (!error) return null;
    
    return error.details.reduce((acc, curr) => {
      acc[curr.path[0]] = curr.message;
      return acc;
    }, {});
  }
}

export default AuthValidator; 