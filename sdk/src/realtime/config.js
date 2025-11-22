export const CONFIG = {
  development: {
    serverUrl: 'http://localhost:8080',
    cdnUrl: 'https://mesulo.b-cdn.net'
  },
  production: {
    serverUrl: 'https://nodejs-production-9eae9.up.railway.app',
    cdnUrl: 'https://mesulo.b-cdn.net'
  }
};

export function detectEnvironment() {
  return ['localhost', '127.0.0.1'].some(host => 
    window.location.hostname.includes(host)) || 
    window.location.protocol === 'file:' ||
    !window.location.hostname;
}

export function getCurrentConfig() {
  const isDev = detectEnvironment();
  return isDev ? CONFIG.development : CONFIG.production;
}

