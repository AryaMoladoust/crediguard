import { connectDB } from './db';
import Product from '@/models/Product';
import { shape } from './catalog';

// خواندن محصولات برای صفحه‌های سروری؛ در خطای دیتابیس لیست خالی و failed=true برمی‌گردد
export async function listProducts(filter = {}, sort = { sold: -1, createdAt: -1 }, limit = 8, skip = 0) {
  try {
    await connectDB();
    const [items, total] = await Promise.all([Product.find(filter).sort(sort).skip(skip).limit(limit).lean(), Product.countDocuments(filter)]);
    return { items: items.map(shape), total, failed: false };
  } catch (e) {
    console.error('listProducts:', e?.message);
    return { items: [], total: 0, failed: true };
  }
}
export async function getProductBySlug(slug) {
  try { await connectDB(); const p = await Product.findOne({ slug }).lean(); return p ? { ...shape(p), specs: (p.specs || []).map((s) => ({ k: s.k, v: s.v })), caption: p.caption || '' } : null; }
  catch (e) { console.error('getProduct:', e?.message); return null; }
}
