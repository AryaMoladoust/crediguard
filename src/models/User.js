import mongoose from 'mongoose';
const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    phone: { type: String, required: true, unique: true, index: true },
    email: { type: String, trim: true, lowercase: true, maxlength: 120 },
    passwordHash: { type: String, required: true },
    address: { type: String, maxlength: 500, default: '' },
    // کد ملی فقط به‌صورت HMAC (یکتا بودن) و نسخه‌ی ماسک‌شده نگهداری می‌شود
    nationalIdHash: { type: String, unique: true, sparse: true },
    nationalIdMasked: String,
    phoneVerified: { type: Boolean, default: false },
    phoneVerifiedAt: Date,
    synthetic: { type: Boolean, default: false },
    passwordChangedAt: Date
  },
  { timestamps: true }
);
export default mongoose.models.User || mongoose.model('User', UserSchema);
