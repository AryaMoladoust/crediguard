import { connectDB } from '@/lib/db';
import Order, { AWAITING_PAYMENT } from '@/models/Order';
import { isAdmin, unauthorized, bad } from '@/lib/admin-guard';
import { parsePaging } from '@/lib/paging';
import { customersPage, groupByPhone, shapeCustomer } from '@/lib/customer-query';
import { productLine, codeOf } from '@/lib/order-query';
export const dynamic = 'force-dynamic';

// بدون phone: فهرست صفحه‌بندی‌شده‌ی مشتریان (q, sort, mode=new, page, pageSize) + summary کل.
// با phone: پرونده‌ی یک مشتری.
export async function GET(req) {
  if (!(await isAdmin())) return unauthorized();
  const sp = new URL(req.url).searchParams;
  const phone = sp.get('phone');
  if (phone && !/^\d{5,15}$/.test(phone)) return bad('شماره نامعتبر');
  try {
    await connectDB();
    if (!phone) return Response.json(await customersPage(sp, parsePaging(sp)));

    const [c] = await Order.aggregate([{ $match: { status: { $ne: AWAITING_PAYMENT }, 'customer.phone': phone } }, ...groupByPhone]);
    if (!c) return bad('مشتری پیدا نشد', 404);
    const orders = await Order.find({ 'customer.phone': phone, status: { $ne: AWAITING_PAYMENT } }).sort({ createdAt: -1 }).limit(100).lean();
    return Response.json({
      customer: shapeCustomer(c),
      orders: orders.map((o) => ({ id: String(o._id), code: codeOf(o), product: productLine(o), total: o.total || 0, method: o.method || 'cash', status: o.status || 'pending', createdAt: o.createdAt }))
    });
  } catch (e) {
    console.error('admin customers GET:', e);
    return bad('خطای سرور', 500);
  }
}
