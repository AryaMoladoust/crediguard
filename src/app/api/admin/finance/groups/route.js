import { connectDB } from '@/lib/db';
import Order, { AWAITING_PAYMENT } from '@/models/Order';
import { isAdmin, unauthorized, bad } from '@/lib/admin-guard';
import { escapeRegex } from '@/lib/paging';
export const dynamic = 'force-dynamic';

const DIMENSIONS = ['payment-type', 'status', 'category', 'customer', 'amount'];
const BAND = [[10_000_000, 'کمتر از ۱۰ میلیون'], [25_000_000, '۱۰ تا ۲۵ میلیون'], [50_000_000, '۲۵ تا ۵۰ میلیون']];
const LAST_BAND = 'بیشتر از ۵۰ میلیون';

// تفکیک مالی روی کل دیتابیس. جز بُعد «وضعیت»، سفارش‌های لغوشده حساب نمی‌شوند.
// بُعد «دسته»: مبلغ هر ردیف کالا (قیمت×تعداد) به دسته‌ی همان کالا نسبت داده می‌شود، پس جمع گروه‌ها = جمع فروش.
export async function GET(req) {
  if (!(await isAdmin())) return unauthorized();
  const sp = new URL(req.url).searchParams;
  const dimension = sp.get('dimension');
  if (!DIMENSIONS.includes(dimension)) return bad('بُعد نامعتبر');
  const match = { status: dimension === 'status' ? { $ne: AWAITING_PAYMENT } : { $nin: ['cancelled', AWAITING_PAYMENT] } };
  const q = (sp.get('q') || '').trim().slice(0, 80);
  if (q) { const re = new RegExp(escapeRegex(q), 'i'); match.$or = [{ code: re }, { 'customer.name': re }, { 'customer.phone': re }, { 'items.name': re }]; }

  const sumGroup = { count: { $sum: 1 }, total: { $sum: '$total' } };
  let pipeline;
  if (dimension === 'payment-type') pipeline = [{ $group: { _id: '$method', ...sumGroup } }];
  else if (dimension === 'status') pipeline = [{ $group: { _id: '$status', ...sumGroup } }];
  else if (dimension === 'customer') pipeline = [{ $sort: { createdAt: 1 } }, { $group: { _id: '$customer.phone', name: { $last: '$customer.name' }, ...sumGroup } }];
  else if (dimension === 'amount') {
    pipeline = [{ $group: { _id: { $switch: { branches: BAND.map(([lt, label]) => ({ case: { $lt: ['$total', lt] }, then: label })), default: LAST_BAND } }, ...sumGroup } }];
  } else {
    pipeline = [
      { $unwind: '$items' },
      { $lookup: { from: 'products', localField: 'items.product', foreignField: '_id', as: 'p' } },
      { $group: { _id: { $ifNull: [{ $arrayElemAt: ['$p.category', 0] }, 'unknown'] }, orders: { $addToSet: '$_id' }, total: { $sum: { $multiply: [{ $ifNull: ['$items.price', 0] }, { $ifNull: ['$items.qty', 0] }] } } } },
      { $project: { count: { $size: '$orders' }, total: 1 } }
    ];
  }
  try {
    await connectDB();
    const rows = await Order.aggregate([{ $match: match }, ...pipeline, { $sort: { total: -1 } }, { $limit: 100 }]);
    const [t] = await Order.aggregate([{ $match: match }, { $group: { _id: null, count: { $sum: 1 }, total: { $sum: '$total' } } }]);
    return Response.json({
      groups: rows.map((r) => ({ key: dimension === 'customer' ? r.name || '—' : String(r._id), count: r.count, total: r.total })),
      count: t?.count || 0, total: t?.total || 0
    });
  } catch (e) {
    console.error('admin finance groups:', e);
    return bad('خطای سرور', 500);
  }
}
