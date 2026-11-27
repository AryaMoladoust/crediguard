import mongoose from 'mongoose';
const SystemSettingSchema = new mongoose.Schema({
  key: { type: String, unique: true, default: 'main' },
  general: { type: mongoose.Schema.Types.Mixed, default: {} },
  frontend: { type: mongoose.Schema.Types.Mixed, default: {} },
  backend: { type: mongoose.Schema.Types.Mixed, default: {} },
  access: { type: mongoose.Schema.Types.Mixed, default: {} },
  updatedBy: { type: String, default: '' },
}, { timestamps: true, minimize: false });
export default mongoose.models.SystemSetting || mongoose.model('SystemSetting', SystemSettingSchema);
