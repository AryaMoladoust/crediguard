import mongoose from 'mongoose';
const Msg = new mongoose.Schema({
  from: { type: String, enum: ['customer', 'bot', 'admin'], required: true },
  text: { type: String, required: true, maxlength: 3000 },
  adminName: String,
  intent: String,
  at: { type: Date, default: Date.now }
}, { _id: true });
const S = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  synthetic: { type: Boolean, default: false },
  // شناسه‌ی پیام فرم تماس قدیمی؛ مانع تبدیل تکراری در اجرای هم‌زمان مهاجرت
  legacyContactId: { type: mongoose.Schema.Types.ObjectId, unique: true, sparse: true },
  guest: { name: String, phone: { type: String, index: true } }, // پیام فرم تماس بدون ورود
  status: { type: String, enum: ['bot_answered', 'waiting_admin', 'answered', 'closed'], default: 'bot_answered', index: true },
  handoff: { type: Boolean, default: false }, // از این پس پاسخ‌گو انسان است
  unreadAdmin: { type: Number, default: 0 },
  unreadCustomer: { type: Number, default: 0 },
  lastMessageAt: { type: Date, default: Date.now, index: true },
  messages: [Msg]
}, { timestamps: true });
export default mongoose.models.SupportConversation || mongoose.model('SupportConversation', S);
