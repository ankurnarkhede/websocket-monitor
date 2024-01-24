/* eslint-disable no-undef */
const WebSocket = require("ws");

class WebSocketMonitor {
  constructor(options = {}) {
    this.websocketUrl = options.websocketUrl || "wss://echo.websocket.org";
    this.pingInterval = options.pingInterval || 10000;
    this.retry = options.retry !== false;
    this.retryAttempts = options.retryAttempts || -1;
    this.retryCount = 0;
    this.errorTimestamps = [];
    this.connectionActive = true;
    this.debug = options.debug === true;

    this.connect();

    // Register exit, SIGINT, and SIGTERM event handlers
    process.on("exit", () => {
      if (this.connectionActive) {
        this.close();
      }
    });

    process.on("SIGINT", () => {
      console.log("Received SIGINT. Closing WebSocketMonitor.");
      this.close();
      process.exit(0);
    });

    process.on("SIGTERM", () => {
      console.log("Received SIGTERM. Closing WebSocketMonitor.");
      this.close();
      process.exit(0);
    });
  }

  log(...args) {
    if (this.debug) {
      const timestamp = new Date().toISOString();
      console.log(`${timestamp}:`, ...args);
    }
  }

  connect() {
    this.ws = new WebSocket(this.websocketUrl);

    this.ws.on("open", () => {
      this.log("WebSocket connection opened");
      this.setupPingInterval();
    });

    this.ws.on("message", (message, isBinary) => {
      this.log(`message received: ${message}`);
    });

    this.ws.on("error", (error) => {
      console.error("WebSocket error:", error);
      this.errorTimestamps.push(new Date().toISOString());

      if (this.retry) {
        this.retryConnection();
      }
    });

    this.ws.on("close", (code, reason) => {
      this.log(`WebSocket connection closed, code=${code}, reason=${reason}`);
      this.errorTimestamps.push(new Date().toISOString());
      this.clearPingInterval();
      if (this.retry) {
        this.retryConnection();
      }
    });
  }

  sendPing() {
    this.ws.send("ping");
  }

  setupPingInterval() {
    this.pingIntervalId = setInterval(() => {
      this.sendPing();
    }, this.pingInterval);
  }

  clearPingInterval() {
    clearInterval(this.pingIntervalId);
  }

  retryConnection() {
    if (this.retryAttempts === -1 || this.retryCount < this.retryAttempts) {
      this.retryCount++;
      this.log(
        `Retrying connection (${this.retryCount}/${this.retryAttempts})...`
      );
      this.clearPingInterval();
      this.connect();
    } else {
      console.error(
        "Retry attempts exhausted. Unable to establish WebSocket connection."
      );
      this.close();
    }
  }

  close() {
    this.clearPingInterval();
    this.ws.close();
    this.connectionActive = false;

    // Log here with console.log() as we want this to get logged everytime
    console.log(
      "WebSocketMonitor closed. Error timestamps: ",
      this.errorTimestamps.join(", ")
    );
  }
}

// Export the class based on the module system (CommonJS or ES Modules)
if (typeof exports === "object" && typeof module === "object") {
  module.exports = WebSocketMonitor;
} else if (typeof define === "function" && define.amd) {
  define([], () => WebSocketMonitor);
} else if (typeof exports === "object") {
  exports.WebSocketMonitor = WebSocketMonitor;
} else {
  window.WebSocketMonitor = WebSocketMonitor;
}
