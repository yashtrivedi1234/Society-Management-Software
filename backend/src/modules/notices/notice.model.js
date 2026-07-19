import mongoose from 'mongoose';

const noticeSchema = new mongoose.Schema(
  {
    societyId: { type: String, required: true, default: 'default', index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    date: { type: String, required: true, index: true },
    postedBy: { type: String, required: true, trim: true },
    pinned: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Notice = mongoose.model('Notice', noticeSchema);
