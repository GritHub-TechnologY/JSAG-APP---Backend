import User from '../models/user.model.js';
// import { redisClient } from '../app.js';
import { logger } from '../config/logger.config.js';
import WebSocketService from './websocket.service.js';

class NotificationService {
  /**
   * Send real-time alert for high-risk situation
   */
  static async sendRiskAlert(riskData) {
    try {
      const {
        memberId,
        name,
        riskLevel,
        factors,
        metrics
      } = riskData;

      // Create alert payload
      const alert = {
        type: 'risk_alert',
        timestamp: new Date(),
        severity: riskLevel,
        member: {
          id: memberId,
          name
        },
        details: {
          factors,
          metrics
        },
        status: 'unread'
      };

      // Store alert in Redis for real-time access
      const alertKey = `alert:${memberId}:${Date.now()}`;
      // await redisClient.set(alertKey, JSON.stringify(alert), 'EX', 86400); // Expire in 24 hours

      // Add to active alerts list
      await redisClient.zAdd('active_alerts', {
        score: Date.now(),
        value: alertKey
      });

      // Find leaders/admins to notify
      const member = await User.findById(memberId).select('dayGroup');
      const notifyUsers = await User.find({
        $or: [
          { role: 'admin' },
          {
            role: 'leader',
            dayGroup: member.dayGroup
          }
        ]
      }).select('_id');

      // Store notifications for each user
      const userIds = [];
      for (const user of notifyUsers) {
        const userNotificationKey = `notifications:${user._id}`;
        await redisClient.zAdd(userNotificationKey, {
          score: Date.now(),
          value: alertKey
        });
        userIds.push(user._id.toString());
      }

      // Send real-time notification via WebSocket
      WebSocketService.sendAlert(userIds, {
        ...alert,
        id: alertKey
      });

      return alert;
    } catch (error) {
      logger.error('Risk alert creation error:', error);
      throw error;
    }
  }

  /**
   * Get active alerts for a user
   */
  static async getActiveAlerts(userId, options = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        status
      } = options;

      const start = (page - 1) * limit;
      const end = start + limit - 1;

      // Get user's role and day group
      const user = await User.findById(userId).select('role dayGroup');

      // Get alert keys based on user's role
      let alertKeys;
      if (user.role === 'admin') {
        // Admins see all alerts
        alertKeys = await redisClient.zRange('active_alerts', start, end, { REV: true });
      } else if (user.role === 'leader') {
        // Leaders see alerts for their day group
        const dayGroupAlerts = await redisClient.zRange(`alerts:dayGroup:${user.dayGroup}`, start, end, { REV: true });
        alertKeys = dayGroupAlerts;
      }

      // Get alert details
      const alerts = [];
      for (const key of alertKeys) {
        const alert = await redisClient.get(key);
        if (alert) {
          const parsedAlert = JSON.parse(alert);
          if (!status || parsedAlert.status === status) {
            alerts.push({
              ...parsedAlert,
              id: key
            });
          }
        }
      }

      return alerts;
    } catch (error) {
      logger.error('Get active alerts error:', error);
      throw error;
    }
  }

  /**
   * Mark alert as read
   */
  static async markAlertRead(alertId, userId) {
    try {
      const alertKey = `alert:${alertId}`;
      const alert = await redisClient.get(alertKey);

      if (!alert) {
        throw new Error('Alert not found');
      }

      const parsedAlert = JSON.parse(alert);
      parsedAlert.status = 'read';
      parsedAlert.readBy = parsedAlert.readBy || [];
      parsedAlert.readBy.push({
        userId,
        timestamp: new Date()
      });

      await redisClient.set(alertKey, JSON.stringify(parsedAlert));

      // Send real-time update via WebSocket
      const user = await User.findById(userId).select('role dayGroup');
      const notifyUsers = await this.getAlertSubscribers(user, parsedAlert.member.id);
      
      WebSocketService.sendNotification(notifyUsers, {
        type: 'alert_update',
        alertId,
        status: 'read',
        updatedBy: userId
      });

      return {
        ...parsedAlert,
        id: alertId
      };
    } catch (error) {
      logger.error('Mark alert read error:', error);
      throw error;
    }
  }

  /**
   * Get alert statistics
   */
  static async getAlertStats(userId) {
    try {
      const user = await User.findById(userId).select('role dayGroup');
      
      let alertKeys;
      if (user.role === 'admin') {
        alertKeys = await redisClient.zRange('active_alerts', 0, -1);
      } else if (user.role === 'leader') {
        alertKeys = await redisClient.zRange(`alerts:dayGroup:${user.dayGroup}`, 0, -1);
      }

      const stats = {
        total: alertKeys.length,
        unread: 0,
        byRiskLevel: {
          high: 0,
          medium: 0,
          low: 0
        },
        byFactor: {}
      };

      for (const key of alertKeys) {
        const alert = await redisClient.get(key);
        if (alert) {
          const parsedAlert = JSON.parse(alert);
          
          if (parsedAlert.status === 'unread') {
            stats.unread++;
          }

          stats.byRiskLevel[parsedAlert.severity]++;

          parsedAlert.details.factors.forEach(factor => {
            stats.byFactor[factor] = (stats.byFactor[factor] || 0) + 1;
          });
        }
      }

      return stats;
    } catch (error) {
      logger.error('Get alert stats error:', error);
      throw error;
    }
  }

  /**
   * Get users who should receive alert notifications
   */
  static async getAlertSubscribers(user, memberId) {
    const member = await User.findById(memberId).select('dayGroup');
    const subscribers = await User.find({
      $or: [
        { role: 'admin' },
        {
          role: 'leader',
          dayGroup: member.dayGroup
        }
      ]
    }).select('_id');

    return subscribers.map(s => s._id.toString());
  }

  /**
   * Send system notification
   */
  static async sendSystemNotification(message, userIds) {
    try {
      // Store notification in Redis
      const notificationKey = `system:${Date.now()}`;
      const notification = {
        type: 'system',
        timestamp: new Date(),
        message,
        status: 'unread'
      };

      await redisClient.set(notificationKey, JSON.stringify(notification), 'EX', 86400);

      // Store for each user
      for (const userId of userIds) {
        const userNotificationKey = `notifications:${userId}`;
        await redisClient.zAdd(userNotificationKey, {
          score: Date.now(),
          value: notificationKey
        });
      }

      // Send real-time notification via WebSocket
      WebSocketService.sendSystemMessage(userIds, message);

      return notification;
    } catch (error) {
      logger.error('System notification error:', error);
      throw error;
    }
  }
}

export default NotificationService; 