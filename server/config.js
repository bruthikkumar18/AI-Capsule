require('dotenv').config();

// fallback: build callback from APP_BASE_URL
if (!process.env.GITHUB_CALLBACK_URL && process.env.APP_BASE_URL) {
  process.env.GITHUB_CALLBACK_URL =
    `${process.env.APP_BASE_URL.replace(/\/+$/, '')}/auth/github/callback`;
}

const REQUIRED = [
  'JWT_SECRET',
  'GITHUB_CLIENT_ID',
  'GITHUB_CLIENT_SECRET',
  'GITHUB_CALLBACK_URL',
];

const missing = REQUIRED.filter((key) => !process.env[key]);
if (missing.length) {
  console.error(`Missing required environment variables: ${missing.join(', ')}`);
  console.error('Copy .env.example to .env (local) or set them in the cloud dashboard.');
  process.exit(1);
}

if (process.env.JWT_SECRET.length < 32) {
  console.warn('Warning: JWT_SECRET should be at least 32 characters long.');
}

const JWT_HOURS = 8;

module.exports = {
  port: Number(process.env.PORT) || 3000,
  isProd: process.env.NODE_ENV === 'production',
  jwtSecret: process.env.JWT_SECRET,
  jwtIssuer: 'ai-capsule',
  jwtExpiresIn: `${JWT_HOURS}h`,
  cookieMaxAge: JWT_HOURS * 60 * 60 * 1000,
  github: {
    clientId: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackUrl: process.env.GITHUB_CALLBACK_URL,
  },
};
