import { connectDB } from '@/lib/db';
import Order from '@/models/Order';
import { isAdmin, unauthorized, bad } from '@/lib/admin-guard';
import { parsePaging, pageMeta } from '@/lib/paging';
import { orderFilter, statusSummary, categoryMap, shapeOrder } from '@/lib/order-query';
export const dynamic = 'force-dynamic';

// فهرست صفحه‌بندی‌شده‌ی سفارش‌ها.
// فیلترها: q, method, status (یا active), period (week|month), min, max — همگی روی کل دیتابیس اعمال می‌شوند.
// summary: تعداد و مجموع هر وضعیت روی کل نتیجه (با نادیده‌گرفتن فیلتر status) برای کارت‌های بالای صفحه.
export async function GET(req) {
  if (!(await isAdmin())) return unauthorized();
  try {
    const sp = new URL(req.url).searchParams;
    await connectDB();
    const filter = orderFilter(sp);
    const want = parsePaging(sp);
    const meta = pageMeta(await Order.countDocuments(filter), want.page, want.pageSize);
    const [rows, byStatus] = await Promise.all([
      Order.find(filter).sort({ createdAt: -1, _id: -1 }).skip(meta.skip).limit(meta.pageSize).lean(),
      statusSummary(sp)
    ]);
    const catOf = await categoryMap(rows);
    const { skip, ...paging } = meta;
    return Response.json({ items: rows.map((o) => shapeOrder(o, catOf)), ...paging, summary: { byStatus } });
  } catch (e) {
    console.error('admin orders GET:', e);
    return bad('خطای سرور', 500);
  }
}
