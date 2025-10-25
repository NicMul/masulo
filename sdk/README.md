# Masulo SDK

The Masulo SDK is a JavaScript library that enables real-time communication between websites and the Masulo server through WebSocket connections. It provides dynamic game image updates with beautiful transitions and video hover effects.

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

### Game Image Updates

The SDK automatically finds elements with `data-masulo-game-id` and `data-masulo-tag="true"` attributes and updates their images in real-time:

```html
<!-- Your HTML -->
<div data-masulo-game-id="game-123" data-masulo-tag="true">
  <img src="default-image.jpg" alt="Game">
  <button class="play-button">Play</button>
</div>
```

The SDK will:
- Connect to the server and request game data
- Update images with smooth transitions
- Add video hover effects if video URLs are provided
- Style existing play buttons with hover effects

### Status Management

Monitor connection status and update UI elements:

```javascript
// Update status elements
masulo.updateStatusElements('.connection-status');

// Listen for status changes
masulo.onStatusChange((status) => {
  console.log('Connection status:', status);
});

// Get current status
const status = masulo.getStatus();
console.log('Current status:', status); // 'connected' or 'disconnected'
```

## API Reference

### Constructor

```javascript
new MasuloSDK(options)
```

**Parameters:**
- `options.applicationKey` (string, required): The user ID from your Masulo user document

### Methods

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

#### `updateStatusElements(selector)`

Update DOM elements to show connection status.

**Parameters:**
- `selector` (string): CSS selector for status elements

#### `onStatusChange(callback)`

Listen for connection status changes.

**Parameters:**
- `callback` (function): Callback function that receives status string

#### `getStatus()`

Get current connection status.

**Returns:** `string` - 'connected' or 'disconnected'

### Events

#### Client Events (emitted by SDK)

- `connected`: Fired when connected to the server
- `disconnected`: Fired when disconnected from the server
- `error`: Fired when an error occurs

#### Server Events (received from server)

- `games-response`: Response containing game data for image updates

## Error Handling

The SDK includes automatic error handling:

- **Connection Errors**: Automatically handles connection failures
- **Error Events**: Emits error events for debugging
- **Graceful Degradation**: Continues to work even if some features fail

```javascript
masulo.on('error', (error) => {
  console.error('SDK Error:', error);
  // Handle error appropriately
});
```

## Browser Support

The SDK supports all modern browsers that support:
- WebSockets
- ES6 Classes
- Promise
- CSS Transitions

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

### Basic Game Integration

```html
<!DOCTYPE html>
<html>
<head>
  <title>My Game Site</title>
</head>
<body>
  <!-- Game elements with required attributes -->
  <div data-masulo-game-id="game-123" data-masulo-tag="true">
    <img src="default-image.jpg" alt="Game">
    <button class="play-button">Play Now</button>
  </div>
  
  <!-- Include SDK -->
  <script src="https://mesulo.b-cdn.net/sdk/mesulo-sdk.js" 
          data-application-key="your-user-id"></script>
  
  <script>
    // SDK auto-initializes, but you can also access it manually
    window.masulo.on('connected', () => {
      console.log('SDK connected and ready!');
    });
  </script>
</body>
</html>
```

### Custom Status Display

```html
<div class="connection-status">Connecting...</div>

<script>
  const masulo = new MasuloSDK({
    applicationKey: 'your-user-id'
  });
  
  // Update status display
  masulo.updateStatusElements('.connection-status');
  
  // Custom status handling
  masulo.onStatusChange((status) => {
    console.log('Status changed to:', status);
  });
</script>
```