import mongoose from 'mongoose';
const S = new mongoose.Schema(
  {
    name: { type: String, required: true, maxlength: 80 },
    phone: { type: String, maxlength: 20 },
    email: { type: String, maxlength: 120 },
    message: { type: String, required: true, maxlength: 2000 },
    read: { type: Boolean, default: false }
  },
  { timestamps: true }
);
export default mongoose.models.ContactMessage || mongoose.model('ContactMessage', S);
