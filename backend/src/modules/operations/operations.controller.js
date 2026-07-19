import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiError } from '../../utils/ApiError.js';
import { EmergencyAlert, Parcel, ParkingSlot, SocietyDocument, StaffMember } from './operations.model.js';

const scope = (req) => ({ societyId: req.societyId });

export const listParkingSlots = asyncHandler(async (req, res) => {
  const data = await ParkingSlot.find(scope(req)).sort({ slotNumber: 1 });
  res.json({ data });
});

export const createParkingSlot = asyncHandler(async (req, res) => {
  const { slotNumber } = req.body;
  if (!slotNumber) throw new ApiError(400, 'slotNumber is required');
  const data = await ParkingSlot.create({ ...req.body, societyId: req.societyId });
  req.auditEntity = 'parking';
  req.auditAction = 'create';
  req.auditEntityId = data._id.toString();
  res.status(201).json({ data });
});

export const listStaff = asyncHandler(async (req, res) => {
  const data = await StaffMember.find(scope(req)).sort({ createdAt: -1 });
  res.json({ data });
});

export const createStaff = asyncHandler(async (req, res) => {
  const { name, role } = req.body;
  if (!name || !role) throw new ApiError(400, 'name and role are required');
  const data = await StaffMember.create({ ...req.body, societyId: req.societyId });
  req.auditEntity = 'staff';
  req.auditAction = 'create';
  req.auditEntityId = data._id.toString();
  res.status(201).json({ data });
});

export const updateStaffAttendance = asyncHandler(async (req, res) => {
  const data = await StaffMember.findOneAndUpdate(
    { _id: req.params.id, ...scope(req) },
    { attendanceStatus: req.body.attendanceStatus, shift: req.body.shift },
    { new: true, runValidators: true }
  );
  if (!data) throw new ApiError(404, 'Staff member not found');
  req.auditEntity = 'staff';
  req.auditAction = 'attendance_update';
  req.auditEntityId = data._id.toString();
  res.json({ data });
});

export const listParcels = asyncHandler(async (req, res) => {
  const data = await Parcel.find(scope(req)).sort({ createdAt: -1 });
  res.json({ data });
});

export const createParcel = asyncHandler(async (req, res) => {
  const { flat, recipientName } = req.body;
  if (!flat || !recipientName) throw new ApiError(400, 'flat and recipientName are required');
  const data = await Parcel.create({ ...req.body, societyId: req.societyId });
  req.auditEntity = 'parcel';
  req.auditAction = 'create';
  req.auditEntityId = data._id.toString();
  res.status(201).json({ data });
});

export const markParcelDelivered = asyncHandler(async (req, res) => {
  const data = await Parcel.findOneAndUpdate(
    { _id: req.params.id, ...scope(req) },
    { status: 'delivered', deliveredAt: new Date().toISOString() },
    { new: true }
  );
  if (!data) throw new ApiError(404, 'Parcel not found');
  req.auditEntity = 'parcel';
  req.auditAction = 'mark_delivered';
  req.auditEntityId = data._id.toString();
  res.json({ data });
});

export const listDocuments = asyncHandler(async (req, res) => {
  const data = await SocietyDocument.find(scope(req)).sort({ createdAt: -1 });
  res.json({ data });
});

export const createDocument = asyncHandler(async (req, res) => {
  const { title, category, url } = req.body;
  if (!title || !category || !url) throw new ApiError(400, 'title, category and url are required');
  const data = await SocietyDocument.create({ ...req.body, societyId: req.societyId });
  req.auditEntity = 'document';
  req.auditAction = 'create';
  req.auditEntityId = data._id.toString();
  res.status(201).json({ data });
});

export const listEmergencyAlerts = asyncHandler(async (req, res) => {
  const data = await EmergencyAlert.find(scope(req)).sort({ createdAt: -1 });
  res.json({ data });
});

export const createEmergencyAlert = asyncHandler(async (req, res) => {
  const { flat, raisedBy, type, notes } = req.body;
  if (!flat || !raisedBy) throw new ApiError(400, 'flat and raisedBy are required');
  // Whitelist fields and force the initial status — an alert can't be created pre-'closed'.
  const data = await EmergencyAlert.create({
    societyId: req.societyId,
    flat,
    raisedBy,
    type,
    notes,
    status: 'open',
  });
  req.auditEntity = 'emergency_alert';
  req.auditAction = 'create';
  req.auditEntityId = data._id.toString();
  res.status(201).json({ data });
});

export const updateEmergencyStatus = asyncHandler(async (req, res) => {
  const data = await EmergencyAlert.findOneAndUpdate(
    { _id: req.params.id, ...scope(req) },
    { status: req.body.status || 'acknowledged' },
    { new: true, runValidators: true }
  );
  if (!data) throw new ApiError(404, 'Emergency alert not found');
  req.auditEntity = 'emergency_alert';
  req.auditAction = 'status_update';
  req.auditEntityId = data._id.toString();
  res.json({ data });
});
