import { env } from '../config/env.js';

export function notFoundHandler(req, res) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

export function errorHandler(err, req, res, _next) {
  const isProd = env.nodeEnv === 'production';

  // Map Mongoose validation/cast errors to a clean 400 instead of a 500 that leaks schema details.
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  if (err.name === 'ValidationError' || err.name === 'CastError') {
    statusCode = 400;
    if (isProd) message = 'Invalid request data';
  }

  // MongoDB duplicate-key (unique index) — return a friendly 409 instead of the raw E11000 dump.
  if (err.code === 11000) {
    statusCode = 409;
    const fieldLabels = { flatNumber: 'Flat number', email: 'Email', slotNumber: 'Slot number' };
    const entries = Object.entries(err.keyValue || {}).filter(([key]) => key !== 'societyId');
    if (entries.length) {
      const [field, value] = entries[0];
      message = `${fieldLabels[field] || field} "${value}" already exists`;
    } else {
      message = 'This record already exists';
    }
  }

  // Never expose internal 5xx details (stack/driver messages) to clients in production.
  if (isProd && statusCode >= 500) {
    message = 'Internal server error';
  }
  if (!isProd) {
    console.error(err);
  }

  res.status(statusCode).json({
    message,
    ...(!isProd ? { stack: err.stack } : {}),
  });
}
