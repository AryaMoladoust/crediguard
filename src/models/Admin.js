import mongoose from 'mongoose';
// مدیرانِ پنل (علاوه بر «مدیر کل» که از ADMIN_EMAIL / ADMIN_PASSWORD در env خوانده می‌شود)
const AdminSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 120 },
    passwordHash: { type: String, required: true },
    active: { type: Boolean, default: true },
    lastLoginAt: Date
  },
  { timestamps: true }
);
export default mongoose.models.Admin || mongoose.model('Admin', AdminSchema);
