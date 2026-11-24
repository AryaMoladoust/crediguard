import mongoose from 'mongoose';
// مدل مشترک بین فروشگاه و پنل مدیریت
const ProductSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    sku: { type: String, unique: true, sparse: true }, // کد کالا (برای محصولات قدیمی خالی است؛ از slug استفاده می‌شود)
    brand: String,
    category: { type: String, required: true, index: true },
    price: { type: Number, required: true, min: 0 },
    oldPrice: Number,
    colors: [String],
    colorHex: String,
    caption: String,
    description: String,
    specs: [{ k: String, v: String }],
    stock: { type: Number, default: 0, min: 0 },
    minStock: { type: Number, default: 5, min: 0 }, // نقطه سفارش مجدد
    sold: { type: Number, default: 0 },
    image: String, // تصویر اصلی (= اولین تصویر گالری)
    images: [String], // گالری تصاویر (حداکثر ۸)
    isOffer: { type: Boolean, default: false }
  },
  { timestamps: true }
);
ProductSchema.index({ sold: -1 });
ProductSchema.index({ isOffer: 1 });
ProductSchema.index({ price: 1 });
export default mongoose.models.Product || mongoose.model('Product', ProductSchema);
