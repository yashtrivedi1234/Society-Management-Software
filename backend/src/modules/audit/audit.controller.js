import { asyncHandler } from '../../utils/asyncHandler.js';
import { AuditLog } from './audit.model.js';

export const listAuditLogs = asyncHandler(async (req, res) => {
  const limit = Math.min(Number(req.query.limit || 100), 500);
  const logs = await AuditLog.find({ societyId: req.societyId }).sort({ createdAt: -1 }).limit(limit);
  res.json({ data: logs });
});
