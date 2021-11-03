// 24 Hours
export const PASSWORD_RESET_EXPIRY = 24 * 60 * 60 * 1000;

export const WEB_URL =
  process.env.NODE_ENV === 'production'
    ? 'https://dmg.com'
    : 'http://localhost:8000';
