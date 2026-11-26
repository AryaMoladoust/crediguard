import { connectDB } from '@/lib/db';
import Order from '@/models/Order';
import Product from '@/models/Product';
import SupportConversation from '@/models/SupportConversation';
import { isAdmin, unauthorized, bad } from '@/lib/admin-guard';
export const dynamic = 'force-dynamic';

// رویدادهای واقعی: آخرین تغییرات سفارش‌ها + کالاهای کم‌موجود/ناموجود
export async function GET() {
  if (!(await isAdmin())) return unauthorized();
  try {
    await connectDB();
    const [orders, stock, support] = await Promise.all([
      Order.find({ status: { $ne: 'awaiting_payment' } }).sort({ updatedAt: -1 }).limit(30).lean(),
      Product.find({ $expr: { $lte: ['$stock', { $ifNull: ['$minStock', 5] }] } }).sort({ stock: 1 }).limit(50).lean(),
      SupportConversation.find({ unreadAdmin: { $gt: 0 } }).sort({ lastMessageAt: -1 }).limit(15).populate('user', 'name phone').lean()
    ]);
    return Response.json({
      orders: orders.map((o) => ({
        id: String(o._id), code: o.code || String(o._id).slice(-6).toUpperCase(), customer: o.customer?.name || '—',
        total: o.total || 0, method: o.method || 'cash', status: o.status || 'pending', createdAt: o.createdAt, updatedAt: o.updatedAt
      })),
      stock: stock.map((p) => ({ id: String(p._id), name: p.name, sku: p.sku || String(p.slug || '').toUpperCase(), stock: p.stock ?? 0, minStock: p.minStock ?? 5 })),
      support: support.map((c) => {
        const lastCustomer = [...(c.messages || [])].reverse().find((m) => m.from === 'customer');
        return {
          id: String(c._id),
          name: c.user?.name || c.guest?.name || 'مشتری',
          phone: c.user?.phone || c.guest?.phone || '',
          guest: !c.user,
          unread: c.unreadAdmin || 0,
          message: lastCustomer?.text || '',
          lastMessageAt: c.lastMessageAt,
          status: c.status
        };
      })
    });
  } catch (e) {
    console.error('admin events:', e);
    return bad('خطای سرور', 500);
  }
}
