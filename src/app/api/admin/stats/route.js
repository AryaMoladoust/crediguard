import { connectDB } from '@/lib/db';
import Order from '@/models/Order';
import Product from '@/models/Product';
import { isAdmin, unauthorized, bad } from '@/lib/admin-guard';
import { startOfTehranDay } from '@/lib/tehran';
export const dynamic = 'force-dynamic';

const WEEK = 7 * 86400 * 1000;
const WEEKS = 8;

export async function GET() {
  if (!(await isAdmin())) return unauthorized();
  try {
    await connectDB();
    const start = startOfTehranDay();
    const since = new Date(Date.now() - WEEKS * WEEK);
    const [todayAgg, byStatus, inv, recent, weekly, installmentAgg] = await Promise.all([
      Order.aggregate([{ $match: { createdAt: { $gte: start }, status: { $nin: ['cancelled', 'awaiting_payment'] } } }, { $group: { _id: null, sales: { $sum: '$total' }, orders: { $sum: 1 } } }]),
      Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Product.aggregate([{ $project: { out: { $lte: ['$stock', 0] }, low: { $and: [{ $gt: ['$stock', 0] }, { $lte: ['$stock', { $ifNull: ['$minStock', 5] }] }] } } },
        { $group: { _id: null, total: { $sum: 1 }, out: { $sum: { $cond: ['$out', 1, 0] } }, low: { $sum: { $cond: ['$low', 1, 0] } } } }]),
      Order.find({ status: { $ne: 'awaiting_payment' } }).sort({ createdAt: -1 }).limit(6).lean(),
      Order.aggregate([{ $match: { createdAt: { $gte: since }, status: { $nin: ['cancelled', 'awaiting_payment'] } } }, { $project: { total: 1, createdAt: 1, method: 1 } }]),
      Order.aggregate([{ $match: { method: 'installment', status: { $ne: 'cancelled' } } }, { $group: { _id: null, count: { $sum: 1 }, sum: { $sum: '$total' } } }])
    ]);
    const t = todayAgg[0] || { sales: 0, orders: 0 };
    const i = inv[0] || { total: 0, out: 0, low: 0 };
    const ins = installmentAgg[0] || { count: 0, sum: 0 };
    const statuses = { pending: 0, confirmed: 0, completed: 0, cancelled: 0 };
    byStatus.forEach((s) => { if (s._id in statuses) statuses[s._id] = s.count; });
    // هفته‌ی آخر = آخرین خانه؛ قدیمی‌ترین = اولین خانه
    const weeks = Array.from({ length: WEEKS }, () => ({ sales: 0, installment: 0, orders: 0 }));
    const now = Date.now();
    for (const o of weekly) {
      const k = Math.floor((now - new Date(o.createdAt).getTime()) / WEEK);
      if (k < 0 || k >= WEEKS) continue;
      const w = weeks[WEEKS - 1 - k];
      w.sales += o.total || 0; w.orders += 1;
      if (o.method === 'installment') w.installment += o.total || 0;
    }
    return Response.json({
      today: { sales: t.sales, orders: t.orders },
      pending: statuses.pending,
      statuses,
      installments: ins,
      inventory: { total: i.total, out: i.out, low: i.low, ok: i.total - i.out - i.low },
      weeks,
      recent: recent.map((o) => ({
        id: String(o._id),
        code: o.code || String(o._id).slice(-6).toUpperCase(),
        customer: o.customer?.name || '—',
        product: (o.items || []).map((x) => x.name).join('، ') || '—',
        total: o.total || 0,
        method: o.method || 'cash',
        status: o.status || 'pending',
        createdAt: o.createdAt
      }))
    });
  } catch (e) {
    console.error('admin stats:', e);
    return bad('خطای سرور', 500);
  }
}
