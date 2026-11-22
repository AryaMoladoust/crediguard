import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import Product from '@/models/Product';
import { isAdmin, unauthorized, bad } from '@/lib/admin-guard';
import { CATEGORY_SLUGS, toInt, shape, cleanImage, cleanHex } from '@/lib/catalog';
import { deleteUploadedImage } from '@/lib/images';
export const dynamic = 'force-dynamic';

export async function GET(_req, { params }) {
  if (!(await isAdmin())) return unauthorized();
  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) return bad('شناسه نامعتبر');
  try {
    await connectDB();
    const doc = await Product.findById(id).lean();
    return doc ? Response.json(shape(doc)) : bad('محصول پیدا نشد', 404);
  } catch (e) {
    console.error('admin product GET:', e);
    return bad('خطای سرور', 500);
  }
}

export async function PATCH(req, { params }) {
  if (!(await isAdmin())) return unauthorized();
  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) return bad('شناسه نامعتبر');
  let b;
  try { b = await req.json(); } catch { return bad('درخواست نامعتبر'); }

  const $set = {};
  const $inc = {};
  if (b.name !== undefined) { const v = String(b.name).trim(); if (!v || v.length > 120) return bad('نام نامعتبر'); $set.name = v; }
  if (b.brand !== undefined) $set.brand = String(b.brand).trim().slice(0, 60) || '—';
  if (b.description !== undefined) { const d = String(b.description).trim().slice(0, 2000); $set.description = d; $set.caption = d.slice(0, 100); }
  if (b.isOffer !== undefined) $set.isOffer = !!b.isOffer;
  if (b.category !== undefined) { if (!CATEGORY_SLUGS.includes(b.category)) return bad('دسته‌بندی نامعتبر'); $set.category = b.category; }
  if (b.price !== undefined) { const v = toInt(b.price, 1, 10_000_000_000); if (v === null) return bad('قیمت باید عدد صحیح بزرگ‌تر از صفر باشد'); $set.price = v; }
  if (b.oldPrice !== undefined) { const v = b.oldPrice === '' || b.oldPrice === null ? 0 : toInt(b.oldPrice, 0, 10_000_000_000); if (v === null) return bad('قیمت قبلی نامعتبر'); $set.oldPrice = v; }
  if (b.image !== undefined) { const v = cleanImage(b.image); if (v === null) return bad('آدرس تصویر باید با / یا https:// شروع شود'); $set.image = v || `/img/${$set.category || 'product-placeholder'}.svg`; }
  if (b.colorName !== undefined) { const v = String(b.colorName).trim().slice(0, 40); $set.colors = v ? [v] : []; }
  if (b.hex !== undefined) { const v = cleanHex(b.hex); if (v === null) return bad('کد رنگ نامعتبر'); $set.colorHex = v; }
  if (b.minStock !== undefined) { const v = toInt(b.minStock, 0, 1_000_000); if (v === null) return bad('نقطه سفارش نامعتبر'); $set.minStock = v; }
  if (b.stock !== undefined) { const v = toInt(b.stock, 0, 1_000_000); if (v === null) return bad('موجودی نامعتبر'); $set.stock = v; }
  // تغییر نسبی و اتمیک موجودی (امن در برابر سفارش‌های هم‌زمان)
  if (b.stockDelta !== undefined && b.stock === undefined) { const v = toInt(b.stockDelta, -1_000_000, 1_000_000); if (v === null || v === 0) return bad('مقدار تغییر موجودی نامعتبر'); $inc.stock = v; }

  const update = {};
  if (Object.keys($set).length) update.$set = $set;
  if (Object.keys($inc).length) update.$inc = $inc;
  if (!Object.keys(update).length) return bad('چیزی برای ویرایش ارسال نشده');

  try {
    await connectDB();
    const filter = $inc.stock < 0 ? { _id: id, stock: { $gte: -$inc.stock } } : { _id: id };
    const before = $set.image !== undefined ? await Product.findById(id).select('image').lean() : null;
    const doc = await Product.findOneAndUpdate(filter, update, { new: true, runValidators: true }).lean();
    if (!doc) return bad('محصول پیدا نشد یا موجودی کافی نیست', 404);
    // اگر تصویر آپلودیِ قبلی جایگزین شد، از دیتابیس پاک شود
    if (before?.image && before.image !== doc.image) await deleteUploadedImage(before.image);
    return Response.json(shape(doc));
  } catch (e) {
    console.error('admin product PATCH:', e);
    return bad('خطای سرور', 500);
  }
}

export async function DELETE(_req, { params }) {
  if (!(await isAdmin())) return unauthorized();
  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) return bad('شناسه نامعتبر');
  try {
    await connectDB();
    const doc = await Product.findByIdAndDelete(id).lean();
    if (!doc) return bad('محصول پیدا نشد', 404);
    await deleteUploadedImage(doc.image);
    return Response.json({ ok: true });
  } catch (e) {
    console.error('admin product DELETE:', e);
    return bad('خطای سرور', 500);
  }
}
