import rateLimit from 'express-rate-limit';

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
});

export const defaultLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
});
