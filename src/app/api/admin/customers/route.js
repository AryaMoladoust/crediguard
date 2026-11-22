import { connectDB } from '@/lib/db';
import Order from '@/models/Order';
import { isAdmin, unauthorized, bad } from '@/lib/admin-guard';
export const dynamic = 'force-dynamic';

// مشتریان از روی سفارش‌های واقعی ساخته می‌شوند (گروه‌بندی بر اساس شماره موبایل)
export async function GET(req) {
  if (!(await isAdmin())) return unauthorized();
  const phone = new URL(req.url).searchParams.get('phone');
  if (phone && !/^\d{5,15}$/.test(phone)) return bad('شماره نامعتبر');
  const live = { $ne: ['$status', 'cancelled'] };
  try {
    await connectDB();
    const list = await Order.aggregate([
      ...(phone ? [{ $match: { 'customer.phone': phone } }] : []),
      { $sort: { createdAt: 1 } },
      { $group: {
        _id: '$customer.phone',
        name: { $last: '$customer.name' },
        address: { $last: '$customer.address' },
        orders: { $sum: 1 },
        activeOrders: { $sum: { $cond: [live, 1, 0] } },
        spent: { $sum: { $cond: [live, '$total', 0] } },
        installmentOrders: { $sum: { $cond: [{ $and: [{ $eq: ['$method', 'installment'] }, live] }, 1, 0] } },
        first: { $min: '$createdAt' },
        last: { $max: '$createdAt' }
      } },
      { $sort: { last: -1 } },
      { $limit: 1000 }
    ]);
    const customers = list.map((c) => ({ id: c._id, phone: c._id, name: c.name || '—', address: c.address || '', orders: c.orders, activeOrders: c.activeOrders, spent: c.spent, installmentOrders: c.installmentOrders, first: c.first, last: c.last }));
    if (!phone) return Response.json(customers);
    if (!customers.length) return bad('مشتری پیدا نشد', 404);
    const orders = await Order.find({ 'customer.phone': phone }).sort({ createdAt: -1 }).limit(100).lean();
    return Response.json({
      customer: customers[0],
      orders: orders.map((o) => ({
        id: String(o._id), code: o.code || String(o._id).slice(-6).toUpperCase(),
        product: (o.items || []).map((i) => `${i.name}${i.qty > 1 ? ` ×${i.qty}` : ''}`).join('، ') || '—',
        total: o.total || 0, method: o.method || 'cash', status: o.status || 'pending', createdAt: o.createdAt
      }))
    });
  } catch (e) {
    console.error('admin customers GET:', e);
    return bad('خطای سرور', 500);
  }
}
