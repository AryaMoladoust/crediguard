import { connectDB } from '@/lib/db';
import Order from '@/models/Order';
import { isAdmin, unauthorized, bad } from '@/lib/admin-guard';
import { csvRow, csvResponse } from '@/lib/csv';
import { STATUS_LABEL } from '@/lib/order-flow';
import { orderFilter, categoryMap, categoriesOf, codeOf } from '@/lib/order-query';
export const dynamic = 'force-dynamic';

const CATEGORY = { mobile: 'گوشی', laptop: 'لپ‌تاپ', headphone: 'هدفون', powerbank: 'پاور بانک', accessory: 'لوازم جانبی' };
const METHOD = { cash: 'نقدی', installment: 'اقساطی' };
const fmtDate = (d) => new Date(d).toLocaleDateString('fa-IR', { timeZone: 'Asia/Tehran' });

// خروجی CSV همه‌ی سفارش‌های مطابق فیلتر (نه فقط صفحه‌ی جاری). همه‌ی سلول‌ها از csvCell رد می‌شوند.
export async function GET(req) {
  if (!(await isAdmin())) return unauthorized();
  try {
    const sp = new URL(req.url).searchParams;
    const filter = orderFilter(sp);
    await connectDB();
    const [rows, sums] = await Promise.all([
      Order.find(filter).sort({ createdAt: -1, _id: -1 }).limit(20000).lean(),
      Order.aggregate([{ $match: filter }, { $group: { _id: '$status', sum: { $sum: '$total' } } }])
    ]);
    const catOf = await categoryMap(rows);
    const sum = (...st) => sums.filter((x) => st.includes(x._id)).reduce((s, x) => s + x.sum, 0);
    const lines = [
      csvRow(['شماره سفارش', 'تاریخ', 'مشتری', 'دسته کالا', 'نوع پرداخت', 'مبلغ (تومان)', 'وضعیت']),
      ...rows.map((o) => csvRow([codeOf(o), fmtDate(o.createdAt), o.customer?.name || '—', categoriesOf(o, catOf).map((c) => CATEGORY[c] || c).join('، ') || '—', METHOD[o.method] || '', o.total || 0, STATUS_LABEL[o.status] || o.status])),
      '',
      csvRow(['جمع فروش (بدون لغوشده)', sum('pending', 'confirmed', 'shipped', 'completed')]),
      csvRow(['تکمیل‌شده', sum('completed')]),
      csvRow(['در جریان', sum('pending', 'confirmed', 'shipped')]),
      csvRow(['لغوشده', sum('cancelled')])
    ];
    return csvResponse(lines, `mobiler-orders-${new Date().toISOString().slice(0, 10)}.csv`);
  } catch (e) {
    console.error('admin orders export:', e);
    return bad('خطای سرور', 500);
  }
}
