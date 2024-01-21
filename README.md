# WebSocket Monitor

WebSocket Monitor is a Node.js library designed for monitoring network drops while the WebSocket connection is in process.

## Installation

You can install the library using npm with the following command:

```bash
npm install github:ankurnarkhede/websocket-monitor
```
## Usage

```js
// Import the WebSocketMonitor class
const WebSocketMonitor = require('websocket-monitor');

// Create an instance of WebSocketMonitor with your desired configuration
const monitor = new WebSocketMonitor({
  websocketUrl: 'wss://echo.websocket.org',
  pingInterval: 10000,
  retry: true,
  retryAttempts: 3, // Set to -1 for unlimited retries
});


// Closing the WebSocketMonitor
process.on('SIGINT', () => {
  console.log('Received SIGINT (Ctrl+C). Closing WebSocketMonitor.');
  monitor.close();
  process.exit(0);
});
```

## Confguration Options
- `websocketUrl`: The WebSocket URL to connect to (default: 'wss://echo.websocket.org').
- `pingInterval`: The interval (in milliseconds) for sending "ping" messages (default: 10000).
- `retry`: Whether to retry the WebSocket connection on failure (default: true).
- `retryAttempts`: The number of retry attempts before giving up (-1 for unlimited retries, default: -1).
