import mongoose from 'mongoose';
// تنظیمات پایه‌ی فروشگاه (یک سند با key = 'basic')
const SystemSettingSchema = new mongoose.Schema({
  key: { type: String, unique: true, default: 'basic' },
  siteName: String,
  supportPhone: String,
  showInventoryCount: Boolean,
  allowRegistration: Boolean,
  updatedBy: { type: String, default: '' }
}, { timestamps: true });
export default mongoose.models.SystemSetting || mongoose.model('SystemSetting', SystemSettingSchema);
