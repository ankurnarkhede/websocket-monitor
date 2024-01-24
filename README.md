# WebSocket Monitor

WebSocket Monitor is a Node.js library designed for monitoring network drops while the WebSocket connection is in process.

## Installation

You can install the library using npm with the following command:

```bash
npm install websocket-monitor
```
## Usage

```js
// Import the WebSocketMonitor class
const WebSocketMonitor = require('websocket-monitor');

// Create an instance of WebSocketMonitor with your desired configuration
const webSocketMonitor = new WebSocketMonitor();

(async () => {
  /*
    Perform your task. Close the webSocketMonitor after your task is completed.
  */

  // Closing the WebSocketMonitor
  await webSocketMonitor.close();
});

```

#### Closing the WebSocket Monitor
The instance of WebSocket Monitor can be closed with the `close()` method as shown below.
```js
await webSocketMonitor.close();
```

## Confguration Options
The following options can be passed while initialising WebSocketMonitor.
- `websocketUrl`: The WebSocket URL to connect to (default: 'wss://echo.websocket.org').
- `pingInterval`: The interval (in milliseconds) for sending "ping" messages (default: 10000).
- `retry`: Whether to retry the WebSocket connection on failure (default: true). The process will stop of first failure if this flag is set as `false`.
- `retryAttempts`: The number of retry attempts before giving stopping the process (-1 for unlimited retries, default: -1).
- `debug`: Set to `true` for getting the debug logs.

```js
const WebSocketMonitor = require('websocket-monitor');

// Initialising WebSocketMonitor with configuration options
const monitor = new WebSocketMonitor({
  websocketUrl: "wss://echo.websocket.org",
  pingInterval: 5000,
  retry: true,
  retryAttempts: 10,
  debug: true
});
```