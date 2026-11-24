import { connectDB } from '@/lib/db';
import Order from '@/models/Order';
import Product from '@/models/Product';
import { isAdmin, unauthorized, bad } from '@/lib/admin-guard';
export const dynamic = 'force-dynamic';

export async function GET() {
  if (!(await isAdmin())) return unauthorized();
  try {
    await connectDB();
    const items = await Order.find({ status: { $ne: 'awaiting_payment' } }).sort({ createdAt: -1 }).limit(500).lean();
    const ids = [...new Set(items.flatMap((o) => (o.items || []).map((i) => i.product && String(i.product))).filter(Boolean))];
    const prods = ids.length ? await Product.find({ _id: { $in: ids } }).select('category').lean() : [];
    const catOf = new Map(prods.map((p) => [String(p._id), p.category]));
    return Response.json(
      items.map((o) => ({
        id: String(o._id),
        code: o.code || String(o._id).slice(-6).toUpperCase(),
        customer: o.customer?.name || '—',
        phone: o.customer?.phone || '',
        address: o.customer?.address || '',
        product: (o.items || []).map((i) => `${i.name}${i.qty > 1 ? ` ×${i.qty}` : ''}`).join('، ') || '—',
        categories: [...new Set((o.items || []).map((i) => catOf.get(String(i.product))).filter(Boolean))],
        total: o.total || 0,
        method: o.method || 'cash',
        status: o.status || 'pending',
        paid: o.payment?.status === 'paid',
        createdAt: o.createdAt,
        updatedAt: o.updatedAt
      }))
    );
  } catch (e) {
    console.error('admin orders GET:', e);
    return bad('خطای سرور', 500);
  }
}
