import rateLimit from 'express-rate-limit';

// Strict limiter for credential-entry endpoints (register/login) - the highest-value
// place to slow down brute-force/credential-stuffing attempts in this POC.
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { code: 'TOO_MANY_REQUESTS', message: 'Too many attempts, please try again later' } },
});

// Looser limiter for the rest of the authenticated API surface.
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { code: 'TOO_MANY_REQUESTS', message: 'Too many requests, slow down' } },
});
