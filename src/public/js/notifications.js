class NotificationClient {
  constructor(userId, baseUrl) {
    this.userId = userId;
    this.baseUrl = baseUrl;
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000; // Start with 1 second
    this.handlers = new Map();
  }

  /**
   * Connect to WebSocket server
   */
  connect() {
    const wsUrl = this.baseUrl.replace(/^http/, 'ws');
    this.ws = new WebSocket(wsUrl);

    // Add user ID to headers
    this.ws.addEventListener('open', () => {
      this.ws.send(JSON.stringify({
        type: 'auth',
        userId: this.userId
      }));
      this.reconnectAttempts = 0;
      this.reconnectDelay = 1000;
      console.log('Connected to notification service');
    });

    // Handle incoming messages
    this.ws.addEventListener('message', (event) => {
      try {
        const message = JSON.parse(event.data);
        this.handleMessage(message);
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    });

    // Handle connection close
    this.ws.addEventListener('close', () => {
      console.log('Connection closed');
      this.attemptReconnect();
    });

    // Handle errors
    this.ws.addEventListener('error', (error) => {
      console.error('WebSocket error:', error);
    });
  }

  /**
   * Attempt to reconnect
   */
  attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      setTimeout(() => {
        console.log(`Attempting to reconnect (${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})...`);
        this.connect();
        this.reconnectAttempts++;
        this.reconnectDelay *= 2; // Exponential backoff
      }, this.reconnectDelay);
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  /**
   * Handle incoming messages
   */
  handleMessage(message) {
    const { type } = message;
    const handlers = this.handlers.get(type) || [];
    handlers.forEach(handler => handler(message));

    // Show browser notification for alerts
    if (type === 'alert' && Notification.permission === 'granted') {
      this.showBrowserNotification(message);
    }
  }

  /**
   * Show browser notification
   */
  showBrowserNotification(message) {
    const { data } = message;
    const notification = new Notification('Attendance Alert', {
      body: `${data.member.name}: ${data.details.factors.join(', ')}`,
      icon: '/path/to/icon.png',
      tag: data.id
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
      // Navigate to relevant page
      window.location.href = `/alerts/${data.id}`;
    };
  }

  /**
   * Register message handler
   */
  on(type, handler) {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, []);
    }
    this.handlers.get(type).push(handler);
  }

  /**
   * Remove message handler
   */
  off(type, handler) {
    if (this.handlers.has(type)) {
      const handlers = this.handlers.get(type);
      const index = handlers.indexOf(handler);
      if (index !== -1) {
        handlers.splice(index, 1);
      }
    }
  }

  /**
   * Request notification permission
   */
  static async requestNotificationPermission() {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  }

  /**
   * Close connection
   */
  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

// Usage example:
/*
const client = new NotificationClient('user123', 'http://localhost:3000');

// Request notification permission
NotificationClient.requestNotificationPermission();

// Connect to WebSocket server
client.connect();

// Handle different types of messages
client.on('alert', (message) => {
  console.log('New alert:', message);
  // Update UI or show notification
});

client.on('notification', (message) => {
  console.log('New notification:', message);
  // Update UI
});

client.on('system', (message) => {
  console.log('System message:', message);
  // Show system message
});

// Clean up on page unload
window.addEventListener('unload', () => {
  client.disconnect();
});
*/

export default NotificationClient; 