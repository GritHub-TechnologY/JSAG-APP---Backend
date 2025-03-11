import { Router } from 'express';
import Joi from 'joi';
import AttendanceController from '../controllers/attendance.controller.js';
import { protect, authorize, validateDayGroup } from '../middleware/auth.middleware.js';

const router = Router();

// Validation schemas
const markAttendanceSchema = Joi.object({
  date: Joi.date().iso().required(),
  members: Joi.array().items(
    Joi.object({
      memberId: Joi.string().hex().length(24).required(),
      status: Joi.string().valid('present', 'absent').required(),
      notes: Joi.string().max(500).allow('', null)
    })
  ).min(1).required()
});

const overrideSchema = Joi.object({
  status: Joi.string().valid('present', 'absent').required(),
  reason: Joi.string().min(10).max(500).required()
});

const analyticsQuerySchema = Joi.object({
  startDate: Joi.date().iso().required(),
  endDate: Joi.date().iso().min(Joi.ref('startDate')).required(),
  dayGroup: Joi.string().valid('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday')
});

const attendanceQuerySchema = Joi.object({
  startDate: Joi.date().iso(),
  endDate: Joi.date().iso().min(Joi.ref('startDate')),
  status: Joi.string().valid('present', 'absent', 'system-absent'),
  dayGroup: Joi.string().valid('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'),
  page: Joi.number().integer().min(1),
  limit: Joi.number().integer().min(1).max(100)
});

const exportQuerySchema = Joi.object({
  startDate: Joi.date().iso().required(),
  endDate: Joi.date().iso().min(Joi.ref('startDate')).required(),
  dayGroup: Joi.string().valid('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'),
  format: Joi.string().valid('csv').default('csv')
});

const trendsQuerySchema = Joi.object({
  startDate: Joi.date().iso().required(),
  endDate: Joi.date().iso().min(Joi.ref('startDate')).required(),
  dayGroup: Joi.string().valid('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday')
}).required();

const predictionsQuerySchema = Joi.object({
  startDate: Joi.date().iso().required(),
  endDate: Joi.date().iso().min(Joi.ref('startDate')).required(),
  dayGroup: Joi.string().valid('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday')
}).required();

const visualizationQuerySchema = Joi.object({
  startDate: Joi.date().iso().required(),
  endDate: Joi.date().iso().min(Joi.ref('startDate')).required(),
  dayGroup: Joi.string().valid('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday')
}).required();

const radarQuerySchema = Joi.object({
  timeframe: Joi.number().integer().min(1).max(365).default(30)
}).required();

const trendComparisonSchema = Joi.object({
  dayGroups: Joi.array().items(
    Joi.string().valid('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday')
  ).min(1).required(),
  timeframe: Joi.number().integer().min(1).max(365).default(30)
}).required();

const alertQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  status: Joi.string().valid('unread', 'read')
});

// Validation middleware
const validateRequest = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error } = schema.validate(req[property]);
    if (error) {
      return res.status(400).json({
        status: 'error',
        message: error.details[0].message
      });
    }
    next();
  };
};

// Routes
router.post('/',
  protect,
  authorize('leader'),
  validateDayGroup,
  validateRequest(markAttendanceSchema),
  AttendanceController.markAttendance
);

router.get('/',
  protect,
  authorize('admin', 'leader'),
  validateDayGroup,
  validateRequest(attendanceQuerySchema, 'query'),
  AttendanceController.getAttendance
);

router.patch('/:attendanceId/override',
  protect,
  authorize('admin'),
  validateRequest(overrideSchema),
  AttendanceController.overrideAttendance
);

router.get('/analytics',
  protect,
  authorize('admin', 'leader'),
  validateDayGroup,
  validateRequest(analyticsQuerySchema, 'query'),
  AttendanceController.getAnalytics
);

router.get('/analytics/detailed',
  protect,
  authorize('admin', 'leader'),
  validateDayGroup,
  validateRequest(analyticsQuerySchema, 'query'),
  AttendanceController.getDetailedAnalytics
);

router.get('/analytics/trends',
  protect,
  authorize('admin', 'leader'),
  validateDayGroup,
  validateRequest(trendsQuerySchema, 'query'),
  AttendanceController.getTrends
);

router.get('/analytics/predictions',
  protect,
  authorize('admin', 'leader'),
  validateDayGroup,
  validateRequest(predictionsQuerySchema, 'query'),
  AttendanceController.getPredictions
);

router.get('/export',
  protect,
  authorize('admin', 'leader'),
  validateDayGroup,
  validateRequest(exportQuerySchema, 'query'),
  AttendanceController.exportAttendance
);

// System route for automatic absence marking
router.post('/auto-process',
  protect,
  authorize('admin'),
  AttendanceController.processAutomaticAbsence
);

// Visualization routes
router.get('/visualizations/heatmap',
  protect,
  authorize('admin', 'leader'),
  validateDayGroup,
  validateRequest(visualizationQuerySchema, 'query'),
  AttendanceController.getHeatmapData
);

router.get('/visualizations/timeline',
  protect,
  authorize('admin', 'leader'),
  validateDayGroup,
  validateRequest(visualizationQuerySchema, 'query'),
  AttendanceController.getTimelineData
);

router.get('/visualizations/radar/:memberId',
  protect,
  authorize('admin', 'leader'),
  validateDayGroup,
  validateRequest(radarQuerySchema, 'query'),
  AttendanceController.getMemberRadar
);

router.get('/visualizations/trends/compare',
  protect,
  authorize('admin', 'leader'),
  validateDayGroup,
  validateRequest(trendComparisonSchema, 'query'),
  AttendanceController.getTrendComparison
);

// Alert routes
router.get('/alerts',
  protect,
  authorize('admin', 'leader'),
  validateRequest(alertQuerySchema, 'query'),
  AttendanceController.getAlerts
);

router.patch('/alerts/:alertId/read',
  protect,
  authorize('admin', 'leader'),
  AttendanceController.markAlertRead
);

router.get('/alerts/stats',
  protect,
  authorize('admin', 'leader'),
  AttendanceController.getAlertStats
);

export default router; 