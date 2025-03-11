import Joi from 'joi';

/**
 * Attendance validators
 */
class AttendanceValidator {
  /**
   * Validate mark attendance data
   */
  static validateMarkAttendance(data) {
    const schema = Joi.object({
      date: Joi.date().iso().required(),
      members: Joi.array().items(
        Joi.object({
          memberId: Joi.string().hex().length(24).required(),
          status: Joi.string().valid('present', 'absent').required(),
          notes: Joi.string().max(500).allow('', null)
        })
      ).min(1).required()
    });

    return schema.validate(data, { abortEarly: false });
  }

  /**
   * Validate attendance query
   */
  static validateAttendanceQuery(data) {
    const schema = Joi.object({
      startDate: Joi.date().iso(),
      endDate: Joi.date().iso().min(Joi.ref('startDate')),
      status: Joi.string().valid('present', 'absent', 'system-absent'),
      dayGroup: Joi.string().valid('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'),
      page: Joi.number().integer().min(1),
      limit: Joi.number().integer().min(1).max(100)
    });

    return schema.validate(data, { abortEarly: false });
  }

  /**
   * Validate attendance override
   */
  static validateAttendanceOverride(data) {
    const schema = Joi.object({
      status: Joi.string().valid('present', 'absent').required(),
      reason: Joi.string().min(10).max(500).required()
    });

    return schema.validate(data, { abortEarly: false });
  }

  /**
   * Validate analytics query
   */
  static validateAnalyticsQuery(data) {
    const schema = Joi.object({
      startDate: Joi.date().iso().required(),
      endDate: Joi.date().iso().min(Joi.ref('startDate')).required(),
      dayGroup: Joi.string().valid('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday')
    });

    return schema.validate(data, { abortEarly: false });
  }

  /**
   * Validate export query
   */
  static validateExportQuery(data) {
    const schema = Joi.object({
      startDate: Joi.date().iso().required(),
      endDate: Joi.date().iso().min(Joi.ref('startDate')).required(),
      dayGroup: Joi.string().valid('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'),
      format: Joi.string().valid('csv', 'pdf').default('csv')
    });

    return schema.validate(data, { abortEarly: false });
  }

  /**
   * Validate trends query
   */
  static validateTrendsQuery(data) {
    const schema = Joi.object({
      startDate: Joi.date().iso().required(),
      endDate: Joi.date().iso().min(Joi.ref('startDate')).required(),
      dayGroup: Joi.string().valid('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'),
      timeframe: Joi.number().integer().min(1).max(365).default(30)
    });

    return schema.validate(data, { abortEarly: false });
  }

  /**
   * Validate predictions query
   */
  static validatePredictionsQuery(data) {
    const schema = Joi.object({
      startDate: Joi.date().iso().required(),
      endDate: Joi.date().iso().min(Joi.ref('startDate')).required(),
      dayGroup: Joi.string().valid('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday')
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

export default AttendanceValidator; 