/**
 * Mesulo SDK Configuration
 * Environment detection and server configuration
 */

export const CONFIG = {
  development: {
    serverUrl: 'https://nodejs-production-9eae9.up.railway.app',
    cdnUrl: 'https://mesulo.b-cdn.net'
  },
  production: {
    serverUrl: 'https://nodejs-production-9eae9.up.railway.app',
    cdnUrl: 'https://mesulo.b-cdn.net'
  }
};

/**
 * Detect if running in development environment
 * @returns {boolean} True if development, false if production
 */
export function detectEnvironment() {
  return ['localhost', '127.0.0.1'].some(host => 
    window.location.hostname.includes(host)) || 
    window.location.protocol === 'file:' ||
    !window.location.hostname;
}

/**
 * Get current configuration based on environment
 * @returns {Object} Configuration object with serverUrl and cdnUrl
 */
export function getCurrentConfig() {
  const isDev = detectEnvironment();
  console.log(`[Mesulo SDK] Environment: ${isDev ? 'development' : 'production'}`);
  return isDev ? CONFIG.development : CONFIG.production;
}

