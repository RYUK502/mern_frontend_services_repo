// gateway.js
// If you want to override the gateway URL, set REACT_APP_GATEWAY_URL in your .env file at the project root.
// Default is http://localhost:5000/api (local development)
export const GATEWAY_BASE_URL = (process.env.REACT_APP_GATEWAY_URL || 'http://localhost:5000/api').replace(/\/$/, '');

