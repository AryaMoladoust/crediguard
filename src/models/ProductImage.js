import mongoose from 'mongoose';
// تصویر آپلودشده‌ی کالا؛ در MongoDB ذخیره می‌شود چون فایل‌سیستم Vercel قابل نوشتن (و ماندگار) نیست.
// جدا از Product نگه داشته می‌شود تا لیست محصولات سبک بماند.
const ProductImageSchema = new mongoose.Schema(
  {
    data: { type: Buffer, required: true },
    contentType: { type: String, required: true },
    size: { type: Number, required: true }
  },
  { timestamps: true }
);
export default mongoose.models.ProductImage || mongoose.model('ProductImage', ProductImageSchema);
