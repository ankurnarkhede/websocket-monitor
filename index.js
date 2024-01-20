// websocket-monitor.js

const WebSocket = require('ws');

class WebSocketMonitor {
  constructor(options) {
    this.websocketUrl = options.websocketUrl || 'wss://echo.websocket.org';
    this.pingInterval = options.pingInterval || 10000;
    this.retry = options.retry || false;
    this.retryTimeout = options.retryTimeout || 30000;
    this.retryAttempts = options.retryAttempts || -1;
    this.retryCount = 0;
    this.errorTimestamps = [];

    this.connect();
  }

  connect() {
    this.ws = new WebSocket(this.websocketUrl);

    this.ws.on('open', () => {
      console.log('WebSocket connection opened');
      this.sendPing();
      this.setupPingInterval();
    });

    this.ws.on('message', (message, isBinary) => {
      console.log('received: %s', message);
      if (message.toString() === 'ping') {
        this.sendPing();
      }
    });

    this.ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      this.errorTimestamps.push(new Date().toISOString());

      if (this.retry) {
        this.retryConnection();
      }
    });

    this.ws.on('close', (code, reason) => {
      console.log(`WebSocket connection closed, code=${code}, reason=${reason}`);
    });
  }

  sendPing() {
    this.ws.send('ping');
  }

  setupPingInterval() {
    this.pingIntervalId = setInterval(() => {
      this.sendPing();
    }, this.pingInterval);
  }

  retryConnection() {
    if (this.retryAttempts === -1 || this.retryCount < this.retryAttempts) {
      this.retryCount++;
      console.log(`Retrying connection (${this.retryCount}/${this.retryAttempts})...`);
      clearInterval(this.pingIntervalId);
      setTimeout(() => {
        this.connect();
      }, this.retryTimeout);
    } else {
      console.error('Retry attempts exhausted. Unable to establish WebSocket connection.');
      this.close();
    }
  }

  close() {
    clearInterval(this.pingIntervalId);
    this.ws.close();
    console.log('WebSocket connection closed. No network glitches during the process.');
    console.log('Error timestamps:', this.errorTimestamps.join(', '));
  }
}

// Export the class based on the module system (CommonJS or ES Modules)
if (typeof exports === 'object' && typeof module === 'object') {
  module.exports = WebSocketMonitor;
} else if (typeof define === 'function' && define.amd) {
  define([], () => WebSocketMonitor);
} else if (typeof exports === 'object') {
  exports.WebSocketMonitor = WebSocketMonitor;
} else {
  window.WebSocketMonitor = WebSocketMonitor;
}
