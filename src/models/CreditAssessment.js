import mongoose from 'mongoose';
// نتیجه‌ی تحلیل ایجنت؛ با یک hash از ورودی، تا بدون تغییر داده تحلیل تکراری ساخته نشود
const S = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  inputHash: { type: String, required: true },
  latest: { type: Boolean, default: true },
  engine: String,
  score: Number,
  riskLevel: { type: String, enum: ['low', 'medium', 'high', 'critical'] },
  creditLimit: Number,
  recommendation: { type: String, enum: ['approve', 'review', 'reject'] },
  summary: String,
  reasons: [{ _id: false, label: String, delta: Number }],
  flags: [{ _id: false, code: String, severity: String, text: String }],
  metrics: mongoose.Schema.Types.Mixed,
  trigger: { type: String, enum: ['register', 'customer', 'order', 'admin'], default: 'customer' },
  synthetic: { type: Boolean, default: true }
}, { timestamps: true });
S.index({ user: 1, latest: 1 });
S.index({ latest: 1, recommendation: 1, createdAt: -1 });
export default mongoose.models.CreditAssessment || mongoose.model('CreditAssessment', S);
