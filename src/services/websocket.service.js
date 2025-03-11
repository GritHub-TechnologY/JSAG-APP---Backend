import WebSocket from 'ws';
import { logger } from '../config/logger.config.js';

class WebSocketService {
  static wss;
  static clients = new Map();

  /**
   * Initialize WebSocket server
   */
  static initialize(server) {
    this.wss = new WebSocket.Server({ server });

    this.wss.on('connection', (ws, req) => {
      const userId = req.headers['x-user-id'];
      if (!userId) {
        ws.close(4001, 'User ID not provided');
        return;
      }

      // Store client connection
      if (!this.clients.has(userId)) {
        this.clients.set(userId, new Set());
      }
      this.clients.get(userId).add(ws);

      logger.info(`WebSocket client connected: ${userId}`);

      // Handle client disconnect
      ws.on('close', () => {
        this.clients.get(userId).delete(ws);
        if (this.clients.get(userId).size === 0) {
          this.clients.delete(userId);
        }
        logger.info(`WebSocket client disconnected: ${userId}`);
      });

      // Handle client errors
      ws.on('error', (error) => {
        logger.error(`WebSocket client error: ${userId}`, error);
      });

      // Send initial connection success message
      ws.send(JSON.stringify({
        type: 'connection',
        status: 'success',
        message: 'Connected to real-time notification service'
      }));
    });

    logger.info('WebSocket server initialized');
  }

  /**
   * Send notification to specific users
   */
  static sendNotification(userIds, notification) {
    try {
      const payload = JSON.stringify({
        type: 'notification',
        timestamp: new Date(),
        data: notification
      });

      userIds.forEach(userId => {
        const userClients = this.clients.get(userId);
        if (userClients) {
          userClients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(payload);
            }
          });
        }
      });
    } catch (error) {
      logger.error('WebSocket notification error:', error);
    }
  }

  /**
   * Send alert to specific users
   */
  static sendAlert(userIds, alert) {
    try {
      const payload = JSON.stringify({
        type: 'alert',
        timestamp: new Date(),
        data: alert
      });

      userIds.forEach(userId => {
        const userClients = this.clients.get(userId);
        if (userClients) {
          userClients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(payload);
            }
          });
        }
      });
    } catch (error) {
      logger.error('WebSocket alert error:', error);
    }
  }

  /**
   * Send system message to specific users
   */
  static sendSystemMessage(userIds, message) {
    try {
      const payload = JSON.stringify({
        type: 'system',
        timestamp: new Date(),
        message
      });

      userIds.forEach(userId => {
        const userClients = this.clients.get(userId);
        if (userClients) {
          userClients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(payload);
            }
          });
        }
      });
    } catch (error) {
      logger.error('WebSocket system message error:', error);
    }
  }

  /**
   * Broadcast message to all connected clients
   */
  static broadcast(message) {
    try {
      const payload = JSON.stringify({
        type: 'broadcast',
        timestamp: new Date(),
        message
      });

      this.wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(payload);
        }
      });
    } catch (error) {
      logger.error('WebSocket broadcast error:', error);
    }
  }

  /**
   * Get connected client count
   */
  static getConnectedClientCount() {
    return this.wss.clients.size;
  }

  /**
   * Check if user is connected
   */
  static isUserConnected(userId) {
    return this.clients.has(userId) && this.clients.get(userId).size > 0;
  }

  /**
   * Get all connected user IDs
   */
  static getConnectedUserIds() {
    return Array.from(this.clients.keys());
  }
}

export default WebSocketService; 