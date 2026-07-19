import mongoose from 'mongoose';

const pollSchema = new mongoose.Schema(
  {
    societyId: { type: String, required: true, default: 'default', index: true },
    title: { type: String, required: true, trim: true },
    options: [{ type: String, required: true, trim: true }],
    createdBy: { type: String, required: true, trim: true },
    isClosed: { type: Boolean, default: false },
    votes: [
      {
        flat: { type: String, required: true },
        optionIndex: { type: Number, required: true },
      },
    ],
  },
  { timestamps: true }
);

const eventSchema = new mongoose.Schema(
  {
    societyId: { type: String, required: true, default: 'default', index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    date: { type: String, required: true },
    location: { type: String, default: '', trim: true },
    rsvps: [
      {
        flat: { type: String, required: true },
        residentName: { type: String, required: true },
        status: { type: String, enum: ['yes', 'no', 'maybe'], default: 'yes' },
      },
    ],
  },
  { timestamps: true }
);

const announcementSchema = new mongoose.Schema(
  {
    societyId: { type: String, required: true, default: 'default', index: true },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    channel: { type: String, enum: ['in_app', 'email', 'sms', 'whatsapp'], default: 'in_app' },
    target: { type: String, enum: ['all', 'defaulters', 'members'], default: 'all' },
    sentAt: { type: String, default: () => new Date().toISOString() },
  },
  { timestamps: true }
);

export const Poll = mongoose.model('Poll', pollSchema);
export const SocietyEvent = mongoose.model('SocietyEvent', eventSchema);
export const Announcement = mongoose.model('Announcement', announcementSchema);
