import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiError } from '../../utils/ApiError.js';
import { Facility } from './facility.model.js';
import { FacilityBooking } from './facilityBooking.model.js';

const defaultFacilities = [
  { name: 'Community Hall', description: 'Spacious hall for parties, meetings & celebrations.', pricePerSlot: 2000, slotDuration: '4 hours', capacity: 100, type: 'hall' },
  { name: 'Swimming Pool', description: 'Pool with kids zone. Open 6 AM - 8 PM.', pricePerSlot: 0, slotDuration: 'Per session', capacity: 30, type: 'pool' },
  { name: 'Gym & Fitness Center', description: 'Fully equipped gym. Open 5 AM - 10 PM.', pricePerSlot: 0, slotDuration: 'Per session', capacity: 20, type: 'gym' },
  { name: 'Badminton Court', description: 'Indoor badminton court with lights.', pricePerSlot: 500, slotDuration: '1 hour', capacity: 4, type: 'sport' },
  { name: 'Guest Room', description: 'Air-conditioned guest room with attached bathroom.', pricePerSlot: 1500, slotDuration: 'Per night', capacity: 3, type: 'room' },
];

export const listFacilities = asyncHandler(async (req, res) => {
  let data = await Facility.find({ societyId: req.societyId }).sort({ createdAt: 1 });
  if (data.length === 0) {
    await Facility.insertMany(defaultFacilities.map((item) => ({ ...item, societyId: req.societyId })));
    data = await Facility.find({ societyId: req.societyId }).sort({ createdAt: 1 });
  }
  res.json({ data });
});

export const createFacilityBooking = asyncHandler(async (req, res) => {
  const { facilityId, date, timeSlot, purpose, flat, residentName } = req.body;
  if (!facilityId || !date || !timeSlot || !purpose || !flat || !residentName) {
    throw new ApiError(400, 'facilityId, date, timeSlot, purpose, flat, residentName are required');
  }
  const facility = await Facility.findOne({ _id: facilityId, societyId: req.societyId });
  if (!facility) throw new ApiError(404, 'Facility not found');

  // Whitelist fields explicitly — never spread req.body. The price comes from the facility
  // (a client cannot book for ₹0) and bookings always start 'pending' (no self-approval).
  // Residents may only book under their own flat.
  const bookingFlat = req.user.role === 'member' ? (req.user.flatNumber || flat) : flat;
  const booking = await FacilityBooking.create({
    societyId: req.societyId,
    facilityId,
    date,
    timeSlot,
    purpose,
    flat: bookingFlat,
    residentName,
    amount: facility.pricePerSlot,
    status: 'pending',
  });
  req.auditEntity = 'facility_booking';
  req.auditAction = 'create';
  req.auditEntityId = booking._id.toString();
  const hydrated = await FacilityBooking.findById(booking._id).populate('facilityId', 'name');
  res.status(201).json({ data: hydrated });
});

export const listFacilityBookings = asyncHandler(async (req, res) => {
  const data = await FacilityBooking.find({ societyId: req.societyId }).populate('facilityId', 'name').sort({ date: -1, createdAt: -1 });
  res.json({ data });
});

export const updateFacilityBookingStatus = asyncHandler(async (req, res) => {
  const booking = await FacilityBooking.findOne({ _id: req.params.id, societyId: req.societyId });
  if (!booking) throw new ApiError(404, 'Booking not found');
  booking.status = req.body.status || booking.status;
  await booking.save();
  req.auditEntity = 'facility_booking';
  req.auditAction = 'status_update';
  req.auditEntityId = booking._id.toString();
  const hydrated = await FacilityBooking.findById(booking._id).populate('facilityId', 'name');
  res.json({ data: hydrated });
});
