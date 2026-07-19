import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiError } from '../../utils/ApiError.js';
import { Visitor } from './visitor.model.js';

export const listVisitors = asyncHandler(async (req, res) => {
  const data = await Visitor.find({ societyId: req.societyId }).sort({ createdAt: -1 });
  res.json({ data });
});

export const createVisitor = asyncHandler(async (req, res) => {
  const { name, flat, purpose } = req.body;
  if (!name || !flat || !purpose) throw new ApiError(400, 'name, flat and purpose are required');
  const visitor = await Visitor.create({ ...req.body, societyId: req.societyId });
  req.auditEntity = 'visitor';
  req.auditAction = 'create';
  req.auditEntityId = visitor._id.toString();
  res.status(201).json({ data: visitor });
});

export const updateVisitorStatus = asyncHandler(async (req, res) => {
  const visitor = await Visitor.findOne({ _id: req.params.id, societyId: req.societyId });
  if (!visitor) throw new ApiError(404, 'Visitor not found');
  visitor.status = req.body.status || visitor.status;
  visitor.checkIn = req.body.checkIn ?? visitor.checkIn;
  visitor.checkOut = req.body.checkOut ?? visitor.checkOut;
  await visitor.save();
  req.auditEntity = 'visitor';
  req.auditAction = 'status_update';
  req.auditEntityId = visitor._id.toString();
  res.json({ data: visitor });
});

export const updateVisitor = asyncHandler(async (req, res) => {
  const visitor = await Visitor.findOneAndUpdate({ _id: req.params.id, societyId: req.societyId }, req.body, {
    new: true,
    runValidators: true,
  });
  if (!visitor) throw new ApiError(404, 'Visitor not found');
  req.auditEntity = 'visitor';
  req.auditAction = 'update';
  req.auditEntityId = visitor._id.toString();
  res.json({ data: visitor });
});

export const deleteVisitor = asyncHandler(async (req, res) => {
  const visitor = await Visitor.findOneAndDelete({ _id: req.params.id, societyId: req.societyId });
  if (!visitor) throw new ApiError(404, 'Visitor not found');
  req.auditEntity = 'visitor';
  req.auditAction = 'delete';
  req.auditEntityId = visitor._id.toString();
  res.status(204).send();
});
