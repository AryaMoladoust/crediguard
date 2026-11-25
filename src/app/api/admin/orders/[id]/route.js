import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import Order from '@/models/Order';
import Product from '@/models/Product';
import { getAdmin, unauthorized, bad } from '@/lib/admin-guard';
import { ORDER_STATUSES, STATUS_LABEL, nextStatuses, statusesBefore } from '@/lib/order-flow';
import { codeOf } from '@/lib/order-query';
export const dynamic = 'force-dynamic';

// جزئیات کامل یک سفارش: مشتری و آدرس، اقلام، پرداخت، سابقه‌ی وضعیت و انتقال‌های مجاز بعدی
export async function GET(_req, { params }) {
  if (!(await getAdmin())) return unauthorized();
  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) return bad('شناسه نامعتبر');
  try {
    await connectDB();
    const o = await Order.findById(id).lean();
    if (!o || o.status === 'awaiting_payment') return bad('سفارش پیدا نشد', 404);
    const pids = (o.items || []).map((i) => i.product).filter(Boolean);
    const existing = pids.length ? new Set((await Product.find({ _id: { $in: pids } }).select('_id').lean()).map((p) => String(p._id))) : new Set();
    return Response.json({
      id: String(o._id), code: codeOf(o), status: o.status || 'pending', method: o.method || 'cash',
      total: o.total || 0, note: o.note || '', createdAt: o.createdAt, updatedAt: o.updatedAt, shippedAt: o.shippedAt || null,
      customer: { name: o.customer?.name || '—', phone: o.customer?.phone || '', address: o.customer?.address || '' },
      items: (o.items || []).map((i) => ({ name: i.name, price: i.price || 0, qty: i.qty || 0, productId: i.product && existing.has(String(i.product)) ? String(i.product) : null })),
      payment: { status: o.payment?.status || null, ref: o.payment?.ref || '', paidAt: o.payment?.paidAt || null },
      history: (o.history || []).map((h) => ({ status: h.status, at: h.at, by: h.by || '' })),
      next: nextStatuses(o.status)
    });
  } catch (e) {
    console.error('admin order GET:', e);
    return bad('خطای سرور', 500);
  }
}

// تغییر وضعیت فقط طبق قاعده‌ی انتقال (lib/order-flow.js). شرط روی خود سند اعمال می‌شود تا دو درخواست
// هم‌زمان نتوانند انتقال نامعتبر بسازند یا موجودی را دوبار برگردانند.
export async function PATCH(req, { params }) {
  const admin = await getAdmin();
  if (!admin) return unauthorized();
  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) return bad('شناسه نامعتبر');
  let b;
  try { b = await req.json(); } catch { return bad('درخواست نامعتبر'); }
  const to = b?.status;
  if (!ORDER_STATUSES.includes(to)) return bad('وضعیت نامعتبر');

  try {
    await connectDB();
    const now = new Date();
    const before = await Order.findOneAndUpdate(
      { _id: id, status: { $in: statusesBefore(to) } },
      { $set: { status: to, ...(to === 'shipped' && { shippedAt: now }) }, $push: { history: { status: to, at: now, by: admin.name || admin.email } } },
      { new: false }
    ).lean();
    if (!before) {
      const cur = await Order.findById(id).select('status').lean();
      if (!cur || cur.status === 'awaiting_payment') return bad('سفارش پیدا نشد', 404);
      return bad(`انتقال از «${STATUS_LABEL[cur.status]}» به «${STATUS_LABEL[to]}» مجاز نیست`, 409);
    }
    if (to === 'cancelled') {
      // برگرداندن موجودی کالاها به انبار
      await Promise.all((before.items || []).map((i) => i.product && Product.updateOne({ _id: i.product }, { $inc: { stock: i.qty, sold: -i.qty } })));
    }
    return Response.json({ ok: true, status: to, next: nextStatuses(to) });
  } catch (e) {
    console.error('admin order PATCH:', e);
    return bad('خطای سرور', 500);
  }
}
