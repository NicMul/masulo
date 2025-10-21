# Masulo SDK

The Masulo SDK is a JavaScript library that enables real-time communication between websites and the Masulo server through WebSocket connections. It provides a simple API for tracking user actions and sending custom events.

## Installation

### CDN (Recommended)

Include the SDK directly from the CDN. The SDK automatically loads Socket.IO client from our CDN:

```html
<!-- Development -->
<script src="https://mesulo.b-cdn.net/sdk/mesulo-sdk.js" data-application-key="YOUR_USER_ID"></script>

<!-- Production -->
<script src="https://mesulo.b-cdn.net/sdk/mesulo-sdk.js" data-application-key="YOUR_USER_ID"></script>
```

### Manual Installation

Download the SDK file and include it manually:

```html
<script src="path/to/mesulo-sdk.js"></script>
<script>
  const masulo = new MasuloSDK({
    applicationKey: 'YOUR_USER_ID'
  });
</script>
```

## Socket.IO Client

The SDK automatically loads the Socket.IO client library from our CDN (`https://mesulo.b-cdn.net/socket.io.min.js`). This ensures:

- **Version Compatibility**: Client version matches server version (4.8.1)
- **Performance**: Fast CDN delivery
- **Reliability**: No external dependencies
- **Control**: We control the exact version used

## Configuration

### ApplicationKey

The `applicationKey` is a required parameter that uniquely identifies the user. This should be the user ID from your Masulo user document in MongoDB.

```javascript
const masulo = new MasuloSDK({
  applicationKey: 'de529c70-eb80-4dfb-9540-5075db7545bf' // User ID from MongoDB
});
```

### Environment Detection

The SDK automatically detects the environment based on the hostname:

- **Development**: `localhost` or `127.0.0.1` → connects to `http://localhost:8080`
- **Production**: Any other hostname → connects to `https://www.mesulo.com`

## Usage

### Basic Setup

```javascript
// Initialize the SDK
const masulo = new MasuloSDK({
  applicationKey: 'your-user-id-here'
});

// Listen for connection events
masulo.on('connected', () => {
  console.log('Connected to Masulo server');
});

masulo.on('disconnected', (reason) => {
  console.log('Disconnected from Masulo server:', reason);
});

masulo.on('error', (error) => {
  console.error('SDK Error:', error);
});
```

### Tracking User Actions

Track user interactions on your website:

```javascript
// Track button clicks
document.getElementById('myButton').addEventListener('click', () => {
  masulo.trackAction('button_click', {
    buttonId: 'myButton',
    buttonText: 'Click Me',
    page: 'homepage'
  });
});

// Track form submissions
document.getElementById('contactForm').addEventListener('submit', (e) => {
  masulo.trackAction('form_submit', {
    formId: 'contactForm',
    formData: {
      name: e.target.name.value,
      email: e.target.email.value
    }
  });
});

// Track page views
masulo.trackAction('page_view', {
  page: window.location.pathname,
  title: document.title,
  referrer: document.referrer
});
```

### Custom Events

Send custom events to the server:

```javascript
// Send a custom event
masulo.sendEvent('user_preference_changed', {
  preference: 'theme',
  value: 'dark',
  timestamp: new Date().toISOString()
});

// Listen for responses
masulo.on('sdkResponse', (response) => {
  if (response.success) {
    console.log('Event processed successfully:', response.data);
  } else {
    console.error('Event processing failed:', response.error);
  }
});
```

### Event Listeners

Listen for server responses and events:

```javascript
// Listen for action confirmations
masulo.on('actionProcessed', (data) => {
  console.log('Action processed:', data);
  if (data.success) {
    // Handle successful action processing
  }
});

// Listen for custom server events
masulo.on('server-message', (message) => {
  console.log('Message from server:', message);
});
```

### Connection Management

```javascript
// Check connection status
const status = masulo.getConnectionStatus();
console.log('Connected:', status.connected);
console.log('Reconnect attempts:', status.reconnectAttempts);

// Manually disconnect
masulo.disconnect();

// Reconnect (will happen automatically, but you can trigger it)
masulo.connect();
```

## API Reference

### Constructor

```javascript
new MasuloSDK(options)
```

**Parameters:**
- `options.applicationKey` (string, required): The user ID from your Masulo user document

### Methods

#### `trackAction(action, data)`

Track a user action on your website.

**Parameters:**
- `action` (string): The action name (e.g., 'button_click', 'form_submit')
- `data` (object, optional): Additional data about the action

**Returns:** `boolean` - `true` if the event was sent, `false` if not connected

#### `sendEvent(eventName, data)`

Send a custom event to the server.

**Parameters:**
- `eventName` (string): The event name
- `data` (object, optional): Event data

**Returns:** `boolean` - `true` if the event was sent, `false` if not connected

#### `on(event, callback)`

Add an event listener.

**Parameters:**
- `event` (string): Event name
- `callback` (function): Callback function

#### `off(event, callback)`

Remove an event listener.

**Parameters:**
- `event` (string): Event name
- `callback` (function): Callback function to remove

#### `emit(event, data)`

Emit an event (internal use).

#### `disconnect()`

Manually disconnect from the server.

#### `getConnectionStatus()`

Get current connection status.

**Returns:** Object with connection information

### Events

#### Client Events (emitted by SDK)

- `connected`: Fired when connected to the server
- `disconnected`: Fired when disconnected from the server
- `error`: Fired when an error occurs
- `maxReconnectAttemptsReached`: Fired when max reconnection attempts are reached

#### Server Events (received from server)

- `actionProcessed`: Response to `trackAction()` calls
- `sdkResponse`: Response to `sendEvent()` calls
- `server-message`: Custom messages from the server

## Error Handling

The SDK includes automatic error handling and reconnection:

- **Automatic Reconnection**: Automatically attempts to reconnect on disconnection
- **Exponential Backoff**: Uses exponential backoff for reconnection attempts
- **Max Attempts**: Limits reconnection attempts to prevent infinite loops
- **Error Events**: Emits error events for debugging

```javascript
masulo.on('error', (error) => {
  console.error('SDK Error:', error);
  // Handle error appropriately
});

masulo.on('maxReconnectAttemptsReached', () => {
  console.error('Failed to reconnect after maximum attempts');
  // Show user message or fallback behavior
});
```

## Browser Support

The SDK supports all modern browsers that support:
- WebSockets
- ES6 Classes
- Promise
- Map

## Security

- **Authentication**: All connections require a valid ApplicationKey
- **CORS**: Server configured with appropriate CORS policies
- **HTTPS**: Production connections use HTTPS/WSS
- **Data Sanitization**: Server-side data sanitization and validation

## Troubleshooting

### Connection Issues

1. **Check ApplicationKey**: Ensure the ApplicationKey is a valid user ID from your database
2. **Check Network**: Verify network connectivity and firewall settings
3. **Check Console**: Look for error messages in the browser console
4. **Check Server**: Ensure the Masulo server is running and accessible

### Common Errors

- `ApplicationKey is required`: The ApplicationKey parameter is missing or empty
- `Invalid ApplicationKey`: The ApplicationKey doesn't exist in the user database
- `Authentication failed`: Server-side authentication error
- `Failed to load Socket.IO`: Network issue loading the Socket.IO client library

### Debug Mode

Enable debug logging by opening the browser console. The SDK will log connection status, errors, and events.

## Examples

### E-commerce Tracking

```javascript
const masulo = new MasuloSDK({
  applicationKey: 'user-123'
});

// Track product views
masulo.trackAction('product_view', {
  productId: 'PROD-001',
  productName: 'Widget',
  price: 29.99,
  category: 'Electronics'
});

// Track add to cart
masulo.trackAction('add_to_cart', {
  productId: 'PROD-001',
  quantity: 2,
  totalValue: 59.98
});

// Track purchases
masulo.trackAction('purchase', {
  orderId: 'ORDER-123',
  totalAmount: 59.98,
  currency: 'USD',
  items: [
    { productId: 'PROD-001', quantity: 2, price: 29.99 }
  ]
});
```

### User Engagement Tracking

```javascript
const masulo = new MasuloSDK({
  applicationKey: 'user-456'
});

// Track time spent on page
let startTime = Date.now();
window.addEventListener('beforeunload', () => {
  const timeSpent = Date.now() - startTime;
  masulo.trackAction('time_on_page', {
    page: window.location.pathname,
    timeSpent: timeSpent,
    timeSpentSeconds: Math.round(timeSpent / 1000)
  });
});

// Track scroll depth
let maxScroll = 0;
window.addEventListener('scroll', () => {
  const scrollPercent = Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100);
  if (scrollPercent > maxScroll) {
    maxScroll = scrollPercent;
    masulo.trackAction('scroll_depth', {
      page: window.location.pathname,
      scrollPercent: maxScroll
    });
  }
});
```

## Support

For support and questions, please contact the Masulo team or refer to the server documentation.
