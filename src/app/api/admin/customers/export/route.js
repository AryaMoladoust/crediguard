import { connectDB } from '@/lib/db';
import { isAdmin, unauthorized, bad } from '@/lib/admin-guard';
import { csvRow, csvResponse } from '@/lib/csv';
import { customersForExport } from '@/lib/customer-query';
export const dynamic = 'force-dynamic';

// خروجی CSV همه‌ی مشتریانِ مطابق جست‌وجو/فیلتر. نام مشتری از فرم عمومی می‌آید و از csvCell رد می‌شود.
export async function GET(req) {
  if (!(await isAdmin())) return unauthorized();
  try {
    await connectDB();
    const list = await customersForExport(new URL(req.url).searchParams);
    const iso = (d) => (d ? new Date(d).toISOString().slice(0, 10) : '');
    return csvResponse([
      csvRow(['Phone', 'Name', 'Orders', 'Total spent (Toman)', 'Installment orders', 'First order', 'Last order']),
      ...list.map((c) => csvRow([c.phone, c.name, c.orders, c.spent, c.installmentOrders, iso(c.first), iso(c.last)]))
    ], 'mobiler-customers.csv');
  } catch (e) {
    console.error('admin customers export:', e);
    return bad('خطای سرور', 500);
  }
}
