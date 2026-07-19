import { randomUUID } from 'crypto';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiError } from '../../utils/ApiError.js';
import { BackupRecord, DeviceToken, SocietySetting } from './product.model.js';

export const getSocietySettings = asyncHandler(async (req, res) => {
  let data = await SocietySetting.findOne({ societyId: req.societyId });
  if (!data) data = await SocietySetting.create({ societyId: req.societyId });
  res.json({ data });
});

export const updateSocietySettings = asyncHandler(async (req, res) => {
  const data = await SocietySetting.findOneAndUpdate(
    { societyId: req.societyId },
    req.body,
    { new: true, upsert: true, runValidators: true }
  );
  req.auditEntity = 'society_settings';
  req.auditAction = 'update';
  req.auditEntityId = data._id.toString();
  res.json({ data });
});

export const registerDeviceToken = asyncHandler(async (req, res) => {
  const { token, platform } = req.body;
  if (!token) throw new ApiError(400, 'token is required');
  const data = await DeviceToken.findOneAndUpdate(
    { societyId: req.societyId, userId: req.user.id, token },
    { platform: platform || 'web' },
    { upsert: true, new: true, runValidators: true }
  );
  req.auditEntity = 'device_token';
  req.auditAction = 'register';
  req.auditEntityId = data._id.toString();
  res.status(201).json({ data });
});

export const listBackups = asyncHandler(async (req, res) => {
  const data = await BackupRecord.find({ societyId: req.societyId }).sort({ createdAt: -1 });
  res.json({ data });
});

export const triggerBackup = asyncHandler(async (req, res) => {
  const data = await BackupRecord.create({
    societyId: req.societyId,
    type: req.body.type || 'manual',
    status: 'completed',
    fileUrl: `https://storage.demo.local/${req.societyId}/backup-${randomUUID()}.zip`,
    notes: 'Backup generated successfully',
  });
  req.auditEntity = 'backup';
  req.auditAction = 'trigger';
  req.auditEntityId = data._id.toString();
  res.status(201).json({ data });
});
