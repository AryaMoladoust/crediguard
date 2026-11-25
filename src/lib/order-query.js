import Order, { AWAITING_PAYMENT } from '@/models/Order';
import Product from '@/models/Product';
import { ORDER_STATUSES, STATUS_LABEL } from './order-flow';
import { escapeRegex } from './paging';

const DAY = 86400000;
const nat = (v) => { const n = Number(v); return v !== null && v !== '' && Number.isFinite(n) && n >= 0 ? Math.floor(n) : null; };

// فیلتر مشترک سفارش‌ها (فروش، اقساط، مالی، خروجی). سفارش‌های در انتظار پرداخت هرگز در پنل نیستند.
// status: یکی از وضعیت‌ها، یا «active» (همه به‌جز لغوشده). ignoreStatus برای کارت‌های خلاصه است.
export function orderFilter(sp, { ignoreStatus = false } = {}) {
  const f = { status: { $ne: AWAITING_PAYMENT } };
  const status = sp.get('status');
  if (!ignoreStatus) {
    if (status === 'active') f.status = { $nin: ['cancelled', AWAITING_PAYMENT] };
    else if (ORDER_STATUSES.includes(status)) f.status = status;
  }
  const method = sp.get('method');
  if (method === 'cash' || method === 'installment') f.method = method;

  const period = sp.get('period');
  const days = period === 'week' ? 7 : period === 'month' ? 30 : 0;
  if (days) f.createdAt = { $gte: new Date(Date.now() - days * DAY) };

  const lo = nat(sp.get('min')), hi = nat(sp.get('max'));
  if (lo !== null || hi !== null) f.total = { ...(lo !== null && { $gte: lo }), ...(hi !== null && { $lte: hi }) };

  const q = (sp.get('q') || '').trim().slice(0, 80);
  if (q) {
    const re = new RegExp(escapeRegex(q), 'i');
    f.$or = [{ code: re }, { 'customer.name': re }, { 'customer.phone': re }, { 'items.name': re }];
  }
  return f;
}

// تعداد و مجموع هر وضعیت روی کل نتیجه‌ی فیلتر (نه فقط صفحه‌ی جاری)
export async function statusSummary(sp) {
  const rows = await Order.aggregate([
    { $match: orderFilter(sp, { ignoreStatus: true }) },
    { $group: { _id: '$status', count: { $sum: 1 }, sum: { $sum: '$total' } } }
  ]);
  const byStatus = Object.fromEntries(Object.keys(STATUS_LABEL).map((s) => [s, { count: 0, sum: 0 }]));
  for (const r of rows) if (r._id in byStatus) byStatus[r._id] = { count: r.count, sum: r.sum };
  return byStatus;
}

export const codeOf = (o) => o.code || String(o._id).slice(-6).toUpperCase();
export const productLine = (o) => (o.items || []).map((i) => `${i.name}${i.qty > 1 ? ` ×${i.qty}` : ''}`).join('، ') || '—';

// دسته‌ی کالاهای هر سفارش (از کالکشن محصولات)
export async function categoryMap(orders) {
  const ids = [...new Set(orders.flatMap((o) => (o.items || []).map((i) => i.product && String(i.product))).filter(Boolean))];
  const prods = ids.length ? await Product.find({ _id: { $in: ids } }).select('category').lean() : [];
  return new Map(prods.map((p) => [String(p._id), p.category]));
}
export const categoriesOf = (o, catOf) => [...new Set((o.items || []).map((i) => catOf.get(String(i.product))).filter(Boolean))];

export function shapeOrder(o, catOf) {
  return {
    id: String(o._id), code: codeOf(o), customer: o.customer?.name || '—', phone: o.customer?.phone || '',
    address: o.customer?.address || '', product: productLine(o), categories: categoriesOf(o, catOf),
    total: o.total || 0, method: o.method || 'cash', status: o.status || 'pending',
    paid: o.payment?.status === 'paid', createdAt: o.createdAt, updatedAt: o.updatedAt
  };
}
