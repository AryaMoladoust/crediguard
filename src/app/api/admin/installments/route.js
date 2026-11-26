import { connectDB } from '@/lib/db';
import Order from '@/models/Order';
import { isAdmin, unauthorized, bad } from '@/lib/admin-guard';
import { summarizeInstallments, PAYABLE } from '@/lib/installments.js';
export const dynamic = 'force-dynamic';
const PAGE = 20;

// نمای فروشنده: وضعیت اقساط هر مشتری (تعداد کل، پرداخت‌شده، باقی‌مانده، سررسید بعدی، تأخیر)
// ?filter=all|overdue|soon|down  &q=نام/موبایل  &page=
export async function GET(req) {
  if (!(await isAdmin())) return unauthorized();
  const sp = new URL(req.url).searchParams;
  const filter = ['overdue', 'soon', 'down'].includes(sp.get('filter')) ? sp.get('filter') : 'all';
  const q = (sp.get('q') || '').trim().slice(0, 60).toLowerCase();
  const page = Math.max(1, parseInt(sp.get('page') || '1', 10) || 1);
  try {
    await connectDB();
    const orders = await Order.find({ method: 'installment', status: { $in: PAYABLE }, 'installment.schedule.0': { $exists: true } })
      .select('code status method total customer user installment').populate('user', 'name phone').limit(5000).lean();
    const groups = new Map();
    for (const o of orders) {
      const key = String(o.user?._id || o.customer?.phone || o._id);
      if (!groups.has(key)) groups.set(key, { userId: o.user ? String(o.user._id) : null, name: o.user?.name || o.customer?.name || '—', phone: o.user?.phone || o.customer?.phone || '', orders: [] });
      groups.get(key).orders.push(o);
    }
    const now = new Date();
    let rows = [...groups.values()].map((g) => {
      const s = summarizeInstallments(g.orders, now);
      return { userId: g.userId, name: g.name, phone: g.phone, orders: s.plans.length, totalCount: s.totalCount, paidCount: s.paidCount, remainingCount: s.remainingCount, remainingAmount: s.remainingAmount,
        overdueCount: s.overdueCount, overdueAmount: s.overdueAmount, maxDaysLate: s.maxDaysLate, downDueCount: s.downDueCount, downDueAmount: s.downDueAmount,
        next: s.next && { code: s.next.code, no: s.next.no, dueDate: s.next.dueDate, amount: s.next.amount, daysLeft: s.next.daysLeft } };
    });
    const summary = { customers: rows.length, overdueCustomers: rows.filter((r) => r.overdueCount).length, overdueAmount: rows.reduce((a, r) => a + r.overdueAmount, 0),
      remainingAmount: rows.reduce((a, r) => a + r.remainingAmount, 0), dueSoon: rows.filter((r) => r.next && r.next.daysLeft <= 7).length, downDue: rows.filter((r) => r.downDueCount).length };
    if (q) rows = rows.filter((r) => r.name.toLowerCase().includes(q) || r.phone.includes(q));
    if (filter === 'overdue') rows = rows.filter((r) => r.overdueCount);
    else if (filter === 'soon') rows = rows.filter((r) => r.next && r.next.daysLeft <= 7);
    else if (filter === 'down') rows = rows.filter((r) => r.downDueCount);
    // معوق‌ها اول (بیشترین تأخیر)، بعد نزدیک‌ترین سررسید
    rows.sort((a, b) => b.maxDaysLate - a.maxDaysLate || (a.next ? new Date(a.next.dueDate) : Infinity) - (b.next ? new Date(b.next.dueDate) : Infinity));
    const total = rows.length;
    return Response.json({ items: rows.slice((page - 1) * PAGE, page * PAGE), total, page, pageSize: PAGE, pages: Math.max(1, Math.ceil(total / PAGE)), summary });
  } catch (e) { console.error('admin installments:', e); return bad('خطای سرور', 500); }
}
