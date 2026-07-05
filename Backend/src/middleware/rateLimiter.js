import rateLimit from 'express-rate-limit';

// Global rate limiter: 100 requests per 15 minutes
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    status: 'error',
    message: 'Too many requests, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict auth rate limiter: 10 requests per 15 minutes for login/register
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    status: 'error',
    message: 'Too many authentication attempts, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Message rate limiter: 60 messages per minute
export const messageLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 60,
  message: {
    status: 'error',
    message: 'Message rate limit exceeded. Please slow down.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
