import mongoose from 'mongoose';

const S = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: { type: String, enum: ['installment_reminder'], required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  link: { type: String, default: '/account/credit' },
  dedupeKey: { type: String, required: true, unique: true },
  readAt: { type: Date, default: null }
}, { timestamps: true });

export default mongoose.models.Notification || mongoose.model('Notification', S);
