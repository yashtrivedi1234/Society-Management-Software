import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiError } from '../../utils/ApiError.js';
import { Notice } from './notice.model.js';

export const listNotices = asyncHandler(async (req, res) => {
  const data = await Notice.find({ societyId: req.societyId }).sort({ pinned: -1, date: -1, createdAt: -1 }).limit(2000);
  res.json({ data });
});

export const createNotice = asyncHandler(async (req, res) => {
  const { title, description, category } = req.body;
  if (!title || !description || !category) {
    throw new ApiError(400, 'title, description and category are required');
  }
  const notice = await Notice.create({
    ...req.body,
    societyId: req.societyId,
    date: req.body.date || new Date().toISOString().split('T')[0],
    postedBy: req.body.postedBy || req.user.name,
  });
  req.auditEntity = 'notice';
  req.auditAction = 'create';
  req.auditEntityId = notice._id.toString();
  res.status(201).json({ data: notice });
});

export const updateNotice = asyncHandler(async (req, res) => {
  const notice = await Notice.findOneAndUpdate({ _id: req.params.id, societyId: req.societyId }, req.body, {
    new: true,
    runValidators: true,
  });
  if (!notice) throw new ApiError(404, 'Notice not found');
  req.auditEntity = 'notice';
  req.auditAction = 'update';
  req.auditEntityId = notice._id.toString();
  res.json({ data: notice });
});

export const deleteNotice = asyncHandler(async (req, res) => {
  const notice = await Notice.findOneAndDelete({ _id: req.params.id, societyId: req.societyId });
  if (!notice) throw new ApiError(404, 'Notice not found');
  req.auditEntity = 'notice';
  req.auditAction = 'delete';
  req.auditEntityId = notice._id.toString();
  res.status(204).send();
});
