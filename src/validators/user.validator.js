import Joi from 'joi';

/**
 * User validators
 */
class UserValidator {
  /**
   * Validate user creation
   */
  static validateUserCreate(data) {
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
      dayGroup: Joi.string().valid('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday').required(),
      status: Joi.string().valid('active', 'inactive').default('active'),
      managedMembers: Joi.when('role', {
        is: 'leader',
        then: Joi.array().items(Joi.string().hex().length(24)).default([]),
        otherwise: Joi.forbidden()
      })
    });

    return schema.validate(data, { abortEarly: false });
  }

  /**
   * Validate user update
   */
  static validateUserUpdate(data) {
    const schema = Joi.object({
      name: Joi.string().min(2).max(50),
      email: Joi.string().email(),
      role: Joi.string().valid('admin', 'leader', 'member'),
      dayGroup: Joi.string().valid('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'),
      status: Joi.string().valid('active', 'inactive'),
      managedMembers: Joi.when('role', {
        is: 'leader',
        then: Joi.array().items(Joi.string().hex().length(24)),
        otherwise: Joi.forbidden()
      })
    }).min(1);

    return schema.validate(data, { abortEarly: false });
  }

  /**
   * Validate user query
   */
  static validateUserQuery(data) {
    const schema = Joi.object({
      role: Joi.string().valid('admin', 'leader', 'member'),
      dayGroup: Joi.string().valid('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'),
      status: Joi.string().valid('active', 'inactive'),
      search: Joi.string().max(50),
      page: Joi.number().integer().min(1),
      limit: Joi.number().integer().min(1).max(100),
      sortBy: Joi.string().valid('name', 'email', 'role', 'dayGroup', 'status', 'createdAt'),
      sortOrder: Joi.string().valid('asc', 'desc')
    });

    return schema.validate(data, { abortEarly: false });
  }

  /**
   * Validate profile update
   */
  static validateProfileUpdate(data) {
    const schema = Joi.object({
      name: Joi.string().min(2).max(50),
      email: Joi.string().email(),
      currentPassword: Joi.string().when('newPassword', {
        is: Joi.exist(),
        then: Joi.required(),
        otherwise: Joi.forbidden()
      }),
      newPassword: Joi.string()
        .min(8)
        .max(50)
        .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
        .messages({
          'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character'
        }),
      confirmPassword: Joi.string().valid(Joi.ref('newPassword')).when('newPassword', {
        is: Joi.exist(),
        then: Joi.required(),
        otherwise: Joi.forbidden()
      }).messages({
        'any.only': 'Passwords do not match'
      })
    }).min(1);

    return schema.validate(data, { abortEarly: false });
  }

  /**
   * Validate member assignment
   */
  static validateMemberAssignment(data) {
    const schema = Joi.object({
      memberIds: Joi.array().items(Joi.string().hex().length(24)).min(1).required()
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

export default UserValidator; 