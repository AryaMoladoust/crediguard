import mongoose from 'mongoose';
// کد تأیید موبایل (یک‌بارمصرف، ۵ دقیقه‌ای)؛ فقط هش کد ذخیره می‌شود
const S = new mongoose.Schema({
  phone: { type: String, required: true },
  purpose: { type: String, enum: ['register', 'verify'], required: true },
  codeHash: { type: String, required: true },
  attempts: { type: Number, default: 0 },
  lastSentAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true }
});
S.index({ phone: 1, purpose: 1 }, { unique: true });
S.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
export default mongoose.models.PhoneOtp || mongoose.model('PhoneOtp', S);
