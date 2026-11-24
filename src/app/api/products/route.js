import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import Product from '@/models/Product';
import { CATEGORY_SLUGS, shape, toInt } from '@/lib/catalog';
export const dynamic = 'force-dynamic';

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const SORTS = { popular: { sold: -1, createdAt: -1 }, newest: { createdAt: -1 }, cheap: { price: 1 }, expensive: { price: -1 } };

// فهرست محصولات (فیلتر، جستجو، مرتب‌سازی، صفحه‌بندی) — خروجی یکدست با shape()
export async function GET(req) {
  const sp = new URL(req.url).searchParams;
  const filter = {};
  const cat = sp.get('category');
  if (cat) { if (!CATEGORY_SLUGS.includes(cat)) return Response.json({ items: [], total: 0 }); filter.category = cat; }
  const q = (sp.get('q') || '').trim().slice(0, 60);
  if (q) { const r = { $regex: esc(q), $options: 'i' }; filter.$or = [{ name: r }, { brand: r }, { caption: r }]; }
  const ids = (sp.get('ids') || '').split(',').filter((x) => mongoose.isValidObjectId(x)).slice(0, 100);
  if (sp.get('ids') !== null) filter._id = { $in: ids };
  const min = toInt(sp.get('min') ?? '', 0, 1e11), max = toInt(sp.get('max') ?? '', 0, 1e11);
  if (min !== null || max !== null) filter.price = { ...(min !== null && { $gte: min }), ...(max !== null && { $lte: max }) };
  if (sp.get('stock') === '1') filter.stock = { $gt: 0 };
  if (sp.get('offer') === '1') filter.isOffer = true;
  const sort = SORTS[sp.get('sort')] || SORTS.popular;
  const limit = Math.min(Math.max(Number(sp.get('limit')) || 12, 1), 100);
  const page = Math.max(Number(sp.get('page')) || 1, 1);
  try {
    await connectDB();
    const [items, total] = await Promise.all([
      Product.find(filter).sort(sort).skip((page - 1) * limit).limit(limit).lean(),
      Product.countDocuments(filter)
    ]);
    return Response.json({ items: items.map(shape), total, page, pages: Math.ceil(total / limit) });
  } catch (e) {
    console.error('products api error:', e);
    return Response.json({ error: 'خطای سرور' }, { status: 500 });
  }
}
