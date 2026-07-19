import { ApiError } from '../utils/ApiError.js';

/**
 * Minimal dependency-free fixed-window rate limiter (in-memory).
 *
 * Good enough for a single-instance deployment to blunt brute-force attempts.
 * For a multi-instance/production setup, back this with Redis (e.g. rate-limiter-flexible).
 *
 * @param {object} opts
 * @param {number} opts.windowMs  Window size in milliseconds.
 * @param {number} opts.max       Max requests allowed per key per window.
 * @param {string} [opts.message] Error message when the limit is exceeded.
 * @param {(req) => string} [opts.keyGenerator] Derives the bucket key (default: client IP).
 */
export function rateLimit({ windowMs, max, message = 'Too many requests, please try again later', keyGenerator } = {}) {
  const hits = new Map(); // key -> { count, resetAt }

  // Periodically evict expired buckets so the map doesn't grow unbounded with every unique IP.
  const sweep = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of hits) {
      if (now >= entry.resetAt) hits.delete(key);
    }
  }, windowMs);
  if (typeof sweep.unref === 'function') sweep.unref(); // don't keep the process alive

  const getKey = keyGenerator || ((req) => req.ip || req.socket?.remoteAddress || 'unknown');

  return function rateLimitMiddleware(req, _res, next) {
    const now = Date.now();
    const key = getKey(req);
    const entry = hits.get(key);

    if (!entry || now >= entry.resetAt) {
      hits.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    entry.count += 1;
    if (entry.count > max) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      _res.setHeader('Retry-After', String(retryAfter));
      return next(new ApiError(429, message));
    }
    return next();
  };
}
