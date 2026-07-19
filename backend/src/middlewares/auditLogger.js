import { AuditLog } from '../modules/audit/audit.model.js';

const MUTATION_METHODS = new Set(['POST', 'PATCH', 'PUT', 'DELETE']);
const AUTH_ROUTES_TO_SKIP = new Set(['/api/v1/auth/login', '/api/v1/auth/register']);

function sanitizeRequestBody(body = {}) {
  const clone = { ...body };
  if ('password' in clone) clone.password = '***';
  if ('passwordHash' in clone) clone.passwordHash = '***';
  return clone;
}

export function auditLogger(req, res, next) {
  const shouldTrack = MUTATION_METHODS.has(req.method) && !AUTH_ROUTES_TO_SKIP.has(req.path);
  if (!shouldTrack) return next();

  res.on('finish', () => {
    if (!req.user) return;
    if (res.statusCode < 200 || res.statusCode >= 500) return;

    AuditLog.create({
      societyId: req.societyId || 'default',
      userId: req.user.id,
      userRole: req.user.role,
      method: req.method,
      route: req.originalUrl,
      statusCode: res.statusCode,
      action: req.auditAction || null,
      entity: req.auditEntity || null,
      entityId: req.auditEntityId || req.params?.id || null,
      requestBody: sanitizeRequestBody(req.body),
    }).catch(() => {});
  });

  next();
}
