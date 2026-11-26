import mongoose from 'mongoose';
// اطلاعات اعتباریِ «آزمایشی» هر مشتری (شبیه‌ساز قطعی). هرگز داده‌ی واقعی بانک مرکزی نیست.
const S = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  synthetic: { type: Boolean, default: true, immutable: true },
  source: { type: String, default: 'simulator', immutable: true },
  simVersion: { type: Number, default: 1 },
  data: { type: mongoose.Schema.Types.Mixed, required: true },
  // نسخه‌ی «مثل داده‌ی بانک مرکزی» (فقط یک‌بار هنگام ساخت پروفایل، تصادفی و مصنوعی)؛ ویرایش مدیر روی data اثر می‌گذارد نه این snapshot
  bureau: { type: mongoose.Schema.Types.Mixed },
  // تصمیم نهایی: auto = طبق قوانین سیستم؛ بقیه فقط توسط مدیر تنظیم می‌شود
  decision: { status: { type: String, enum: ['auto', 'approved', 'rejected', 'review'], default: 'auto' }, by: String, note: { type: String, maxlength: 500 }, at: Date },
  adjustments: [{ _id: false, at: Date, by: String, reason: String, changes: mongoose.Schema.Types.Mixed }]
}, { timestamps: true });
export default mongoose.models.CreditProfile || mongoose.model('CreditProfile', S);
