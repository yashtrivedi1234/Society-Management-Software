import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiError } from '../../utils/ApiError.js';
import { Announcement, Poll, SocietyEvent } from './governance.model.js';

const filterBySociety = (req) => ({ societyId: req.societyId });

export const listPolls = asyncHandler(async (req, res) => {
  const data = await Poll.find(filterBySociety(req)).sort({ createdAt: -1 });
  res.json({ data });
});

export const createPoll = asyncHandler(async (req, res) => {
  const { title, options } = req.body;
  if (!title || !Array.isArray(options) || options.length < 2) {
    throw new ApiError(400, 'title and at least 2 options are required');
  }
  const data = await Poll.create({ ...req.body, societyId: req.societyId, createdBy: req.user.name });
  req.auditEntity = 'poll';
  req.auditAction = 'create';
  req.auditEntityId = data._id.toString();
  res.status(201).json({ data });
});

export const voteInPoll = asyncHandler(async (req, res) => {
  const { optionIndex } = req.body;
  const poll = await Poll.findOne({ _id: req.params.id, ...filterBySociety(req) });
  if (!poll) throw new ApiError(404, 'Poll not found');
  if (poll.isClosed) throw new ApiError(400, 'Poll is closed');

  // A resident can only vote as their own flat; management may pass an explicit flat.
  const flat = req.user.role === 'member' ? req.user.flatNumber : req.body.flat;
  if (!flat) throw new ApiError(400, 'flat is required');
  if (!Number.isInteger(optionIndex) || optionIndex < 0 || optionIndex >= poll.options.length) {
    throw new ApiError(400, 'optionIndex is out of range');
  }

  poll.votes = poll.votes.filter((v) => v.flat !== flat);
  poll.votes.push({ flat, optionIndex });
  await poll.save();
  req.auditEntity = 'poll';
  req.auditAction = 'vote';
  req.auditEntityId = poll._id.toString();
  res.json({ data: poll });
});

export const closePoll = asyncHandler(async (req, res) => {
  const data = await Poll.findOneAndUpdate(
    { _id: req.params.id, ...filterBySociety(req) },
    { isClosed: true },
    { new: true }
  );
  if (!data) throw new ApiError(404, 'Poll not found');
  req.auditEntity = 'poll';
  req.auditAction = 'close';
  req.auditEntityId = data._id.toString();
  res.json({ data });
});

export const listEvents = asyncHandler(async (req, res) => {
  const data = await SocietyEvent.find(filterBySociety(req)).sort({ date: 1 });
  res.json({ data });
});

export const createEvent = asyncHandler(async (req, res) => {
  const { title, date } = req.body;
  if (!title || !date) throw new ApiError(400, 'title and date are required');
  const data = await SocietyEvent.create({ ...req.body, societyId: req.societyId });
  req.auditEntity = 'event';
  req.auditAction = 'create';
  req.auditEntityId = data._id.toString();
  res.status(201).json({ data });
});

export const rsvpEvent = asyncHandler(async (req, res) => {
  const { residentName, status } = req.body;
  const event = await SocietyEvent.findOne({ _id: req.params.id, ...filterBySociety(req) });
  if (!event) throw new ApiError(404, 'Event not found');
  // Residents RSVP only as their own flat.
  const flat = req.user.role === 'member' ? req.user.flatNumber : req.body.flat;
  if (!flat || !residentName) throw new ApiError(400, 'flat and residentName are required');
  const allowedStatus = ['yes', 'no', 'maybe'].includes(status) ? status : 'yes';
  event.rsvps = event.rsvps.filter((r) => !(r.flat === flat && r.residentName === residentName));
  event.rsvps.push({ flat, residentName, status: allowedStatus });
  await event.save();
  req.auditEntity = 'event';
  req.auditAction = 'rsvp';
  req.auditEntityId = event._id.toString();
  res.json({ data: event });
});

export const listAnnouncements = asyncHandler(async (req, res) => {
  const data = await Announcement.find(filterBySociety(req)).sort({ createdAt: -1 });
  res.json({ data });
});

export const createAnnouncement = asyncHandler(async (req, res) => {
  const { title, message } = req.body;
  if (!title || !message) throw new ApiError(400, 'title and message are required');
  const data = await Announcement.create({ ...req.body, societyId: req.societyId });
  req.auditEntity = 'announcement';
  req.auditAction = 'create';
  req.auditEntityId = data._id.toString();
  res.status(201).json({ data });
});
