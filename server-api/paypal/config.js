const SANDBOX_BASE_URL = 'https://api-m.sandbox.paypal.com';
const PRODUCTION_BASE_URL = 'https://api-m.paypal.com';

export function paypalEnvironment() {
  const value = String(process.env.PAYPAL_ENVIRONMENT || 'live').trim().toLowerCase();
  return value === 'production' || value === 'live' ? 'production' : 'sandbox';
}

export function paypalBaseUrl() {
  return paypalEnvironment() === 'production'
    ? PRODUCTION_BASE_URL
    : SANDBOX_BASE_URL;
}

export function paypalClientId() {
  return String(process.env.PAYPAL_CLIENT_ID || '').trim();
}

export function paypalClientSecret() {
  return String(
    process.env.PAYPAL_CLIENT_SECRET ||
    process.env.PAYPAL_SECRET ||
    ''
  ).trim();
}
