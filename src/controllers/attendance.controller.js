import AttendanceService from '../services/attendance.service.js';
import ExportService from '../services/export.service.js';
import AnalyticsService from '../services/analytics.service.js';
import PredictiveService from '../services/predictive.service.js';
import VisualizationService from '../services/visualization.service.js';
import NotificationService from '../services/notification.service.js';
import { logger } from '../config/logger.config.js';

class AttendanceController {
  /**
   * Mark attendance for multiple members
   */
  static async markAttendance(req, res) {
    try {
      const { date, members } = req.body;

      const result = await AttendanceService.markAttendance(
        date,
        members,
        req.user.userId
      );

      res.json({
        status: 'success',
        data: {
          modifiedCount: result.modifiedCount,
          upsertedCount: result.upsertedCount
        }
      });
    } catch (error) {
      logger.error('Attendance marking error:', error);
      res.status(400).json({
        status: 'error',
        message: error.message
      });
    }
  }

  /**
   * Get attendance records
   */
  static async getAttendance(req, res) {
    try {
      const {
        startDate,
        endDate,
        status,
        dayGroup,
        page,
        limit
      } = req.query;

      // Apply role-based filters
      const filters = {};
      if (req.user.role === 'leader') {
        filters['member'] = { $in: req.user.managedMembers };
      }

      const result = await AttendanceService.getAttendance(filters, {
        startDate,
        endDate,
        status,
        dayGroup,
        page,
        limit
      });

      res.json({
        status: 'success',
        data: result
      });
    } catch (error) {
      logger.error('Get attendance error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to retrieve attendance records'
      });
    }
  }

  /**
   * Override attendance status (admin only)
   */
  static async overrideAttendance(req, res) {
    try {
      const { attendanceId } = req.params;
      const { status, reason } = req.body;

      const attendance = await AttendanceService.overrideAttendance(
        attendanceId,
        status,
        req.user.userId,
        reason
      );

      res.json({
        status: 'success',
        data: { attendance }
      });
    } catch (error) {
      logger.error('Attendance override error:', error);
      res.status(400).json({
        status: 'error',
        message: error.message
      });
    }
  }

  /**
   * Get attendance analytics
   */
  static async getAnalytics(req, res) {
    try {
      const { startDate, endDate, dayGroup } = req.query;

      // Validate date range
      if (!startDate || !endDate) {
        return res.status(400).json({
          status: 'error',
          message: 'Start date and end date are required'
        });
      }

      // Apply role-based filters for day group
      let targetDayGroup = dayGroup;
      if (req.user.role === 'leader') {
        targetDayGroup = req.user.dayGroup;
      }

      const result = await AttendanceService.getAnalytics(
        startDate,
        endDate,
        targetDayGroup
      );

      res.json({
        status: 'success',
        data: result
      });
    } catch (error) {
      logger.error('Analytics error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to retrieve analytics'
      });
    }
  }

  /**
   * Process automatic absence marking (system only)
   */
  static async processAutomaticAbsence(req, res) {
    try {
      const { date } = req.query;
      const count = await AttendanceService.processAutomaticAbsence(date);

      res.json({
        status: 'success',
        data: {
          processedCount: count,
          date: date || new Date()
        }
      });
    } catch (error) {
      logger.error('Automatic absence processing error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to process automatic absences'
      });
    }
  }

  /**
   * Export attendance records to CSV
   */
  static async exportAttendance(req, res) {
    try {
      const { startDate, endDate, dayGroup } = req.query;

      // Apply role-based filters
      const filters = {};
      if (req.user.role === 'leader') {
        filters['member'] = { $in: req.user.managedMembers };
      }

      const csv = await ExportService.generateAttendanceCSV(filters, {
        startDate,
        endDate,
        dayGroup: req.user.role === 'leader' ? req.user.dayGroup : dayGroup
      });

      // Set response headers for CSV download
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 
        `attachment; filename=attendance-${startDate}-to-${endDate}.csv`);

      res.send(csv);
    } catch (error) {
      logger.error('Attendance export error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to export attendance records'
      });
    }
  }

  /**
   * Get detailed attendance analytics report
   */
  static async getDetailedAnalytics(req, res) {
    try {
      const { startDate, endDate, dayGroup } = req.query;

      // Validate date range
      if (!startDate || !endDate) {
        return res.status(400).json({
          status: 'error',
          message: 'Start date and end date are required'
        });
      }

      // Apply role-based filters for day group
      let targetDayGroup = dayGroup;
      if (req.user.role === 'leader') {
        targetDayGroup = req.user.dayGroup;
      }

      const report = await ExportService.generateAnalyticsReport(
        startDate,
        endDate,
        targetDayGroup
      );

      res.json({
        status: 'success',
        data: report
      });
    } catch (error) {
      logger.error('Detailed analytics error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to generate detailed analytics report'
      });
    }
  }

  /**
   * Get attendance trends and patterns
   */
  static async getTrends(req, res) {
    try {
      const { startDate, endDate, dayGroup } = req.query;

      // Validate date range
      if (!startDate || !endDate) {
        return res.status(400).json({
          status: 'error',
          message: 'Start date and end date are required'
        });
      }

      // Apply role-based filters for day group
      let targetDayGroup = dayGroup;
      if (req.user.role === 'leader') {
        targetDayGroup = req.user.dayGroup;
      }

      const trends = await AnalyticsService.getAttendanceTrends(
        startDate,
        endDate,
        targetDayGroup
      );

      res.json({
        status: 'success',
        data: trends
      });
    } catch (error) {
      logger.error('Trends analysis error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to analyze attendance trends'
      });
    }
  }

  /**
   * Get attendance predictions and risk analysis
   */
  static async getPredictions(req, res) {
    try {
      const { startDate, endDate, dayGroup } = req.query;

      // Validate date range
      if (!startDate || !endDate) {
        return res.status(400).json({
          status: 'error',
          message: 'Start date and end date are required'
        });
      }

      // Apply role-based filters for day group
      let targetDayGroup = dayGroup;
      if (req.user.role === 'leader') {
        targetDayGroup = req.user.dayGroup;
      }

      const predictions = await PredictiveService.generatePredictions(
        startDate,
        endDate,
        targetDayGroup
      );

      res.json({
        status: 'success',
        data: predictions
      });
    } catch (error) {
      logger.error('Predictions generation error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to generate attendance predictions'
      });
    }
  }

  /**
   * Get attendance heatmap data
   */
  static async getHeatmapData(req, res) {
    try {
      const { startDate, endDate, dayGroup } = req.query;

      // Validate date range
      if (!startDate || !endDate) {
        return res.status(400).json({
          status: 'error',
          message: 'Start date and end date are required'
        });
      }

      // Apply role-based filters for day group
      let targetDayGroup = dayGroup;
      if (req.user.role === 'leader') {
        targetDayGroup = req.user.dayGroup;
      }

      const heatmapData = await VisualizationService.generateHeatmapData(
        startDate,
        endDate,
        targetDayGroup
      );

      res.json({
        status: 'success',
        data: heatmapData
      });
    } catch (error) {
      logger.error('Heatmap data generation error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to generate heatmap data'
      });
    }
  }

  /**
   * Get attendance timeline data
   */
  static async getTimelineData(req, res) {
    try {
      const { startDate, endDate, dayGroup } = req.query;

      // Validate date range
      if (!startDate || !endDate) {
        return res.status(400).json({
          status: 'error',
          message: 'Start date and end date are required'
        });
      }

      // Apply role-based filters for day group
      let targetDayGroup = dayGroup;
      if (req.user.role === 'leader') {
        targetDayGroup = req.user.dayGroup;
      }

      const timelineData = await VisualizationService.generateTimelineData(
        startDate,
        endDate,
        targetDayGroup
      );

      res.json({
        status: 'success',
        data: timelineData
      });
    } catch (error) {
      logger.error('Timeline data generation error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to generate timeline data'
      });
    }
  }

  /**
   * Get member attendance pattern radar
   */
  static async getMemberRadar(req, res) {
    try {
      const { memberId } = req.params;
      const { timeframe } = req.query;

      // Validate access
      if (req.user.role === 'leader') {
        if (!req.user.managedMembers.includes(memberId)) {
          return res.status(403).json({
            status: 'error',
            message: 'Access denied: Member not in your group'
          });
        }
      }

      const radarData = await VisualizationService.generateRadarData(
        memberId,
        timeframe
      );

      res.json({
        status: 'success',
        data: radarData
      });
    } catch (error) {
      logger.error('Radar data generation error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to generate radar data'
      });
    }
  }

  /**
   * Get day group trend comparison
   */
  static async getTrendComparison(req, res) {
    try {
      const { dayGroups, timeframe } = req.query;

      // Validate day groups
      if (!dayGroups || !Array.isArray(dayGroups) || dayGroups.length === 0) {
        return res.status(400).json({
          status: 'error',
          message: 'At least one day group must be specified'
        });
      }

      // Apply role-based filters
      let targetDayGroups = dayGroups;
      if (req.user.role === 'leader') {
        targetDayGroups = [req.user.dayGroup];
      }

      const trendData = await VisualizationService.generateTrendComparisonData(
        targetDayGroups,
        timeframe
      );

      res.json({
        status: 'success',
        data: trendData
      });
    } catch (error) {
      logger.error('Trend comparison data generation error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to generate trend comparison data'
      });
    }
  }

  /**
   * Get active alerts
   */
  static async getAlerts(req, res) {
    try {
      const { page, limit, status } = req.query;

      const alerts = await NotificationService.getActiveAlerts(req.user.userId, {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 20,
        status
      });

      res.json({
        status: 'success',
        data: alerts
      });
    } catch (error) {
      logger.error('Get alerts error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to retrieve alerts'
      });
    }
  }

  /**
   * Mark alert as read
   */
  static async markAlertRead(req, res) {
    try {
      const { alertId } = req.params;

      const alert = await NotificationService.markAlertRead(
        alertId,
        req.user.userId
      );

      res.json({
        status: 'success',
        data: alert
      });
    } catch (error) {
      logger.error('Mark alert read error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to mark alert as read'
      });
    }
  }

  /**
   * Get alert statistics
   */
  static async getAlertStats(req, res) {
    try {
      const stats = await NotificationService.getAlertStats(req.user.userId);

      res.json({
        status: 'success',
        data: stats
      });
    } catch (error) {
      logger.error('Get alert stats error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to retrieve alert statistics'
      });
    }
  }
}

export default AttendanceController; 