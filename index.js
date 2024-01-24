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
    this.closeCommandReceived = false;
    this.debug = options.debug === true;
    this.websocketSuccessCodes = options.websocketSuccessCodes || [1000, 1005];

    this.connect();

    // Register exit, SIGINT, and SIGTERM event handlers
    process.on("exit", async () => {
      if (this.connectionActive) {
        await this.close();
      }
    });

    ["SIGINT", "SIGTERM", "SIGQUIT"].forEach((signal) =>
      process.on(signal, async () => {
        console.log(`Received ${signal}. Closing WebSocketMonitor.`);
        await this.close();
        process.exit(0);
      })
    );
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

      // Store the timestamp and retry the connection if this is an abnormal close event
      if (this.websocketSuccessCodes.includes(code)) {
        this.errorTimestamps.push(new Date().toISOString());
        this.clearPingInterval();
        if (this.retry) {
          this.retryConnection();
        }
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
    if (
      (this.retryAttempts === -1 || this.retryCount < this.retryAttempts) &&
      !this.closeCommandReceived
    ) {
      this.retryCount++;
      this.log(
        `Retrying connection (${this.retryCount}/${this.retryAttempts})...`
      );
      this.clearPingInterval();
      this.connect();
    } else {
      if (
        !(this.retryAttempts === -1 || this.retryCount < this.retryAttempts)
      ) {
        console.error(
          "Retry attempts exhausted. Unable to establish WebSocket connection."
        );
      }
      this.close();
    }
  }

  async close() {
    // Set closeCommandReceived = true so that any disconnection in the sleep time doesn't reconnect the WS connection.
    this.closeCommandReceived = true;
    await sleep(5000);
    this.clearPingInterval();
    this.ws.close();
    this.connectionActive = false;

    // Log here with console.log() as we want this to get logged everytime
    if (this.errorTimestamps.length) {
      console.error(
        "WebSocketMonitor closed. Error timestamps: ",
        this.errorTimestamps.join(", ")
      );
    } else {
      console.info("WebSocketMonitor closed. No network drops observed");
    }
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
