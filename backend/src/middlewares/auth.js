import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User } from '../modules/users/user.model.js';
import { ApiError } from '../utils/ApiError.js';

export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) throw new ApiError(401, 'Missing bearer token');

    const payload = jwt.verify(token, env.jwtSecret, { algorithms: ['HS256'] });
    const user = await User.findById(payload.sub).select('_id name email role societyId memberId flatNumber');
    if (!user) throw new ApiError(401, 'Invalid token user');

    req.user = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      societyId: user.societyId,
      memberId: user.memberId ? user.memberId.toString() : null,
      flatNumber: user.flatNumber || null,
    };
    // SECURITY: tenant scope comes from the authenticated user, never the client-supplied
    // x-society-id header. This overrides whatever attachSocietyContext set as a fallback.
    req.societyId = user.societyId;
    next();
  } catch (error) {
    next(error.statusCode ? error : new ApiError(401, 'Unauthorized'));
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new ApiError(403, 'Forbidden'));
    }
    next();
  };
}
