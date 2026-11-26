import mongoose from 'mongoose';
import { randomInt } from 'node:crypto';
import { connectDB } from '@/lib/db';
import Order, { AWAITING_PAYMENT } from '@/models/Order';
import Product from '@/models/Product';
import { toInt, toLatinDigits } from '@/lib/catalog';
import { rateLimit, tooMany } from '@/lib/rate-limit';
import { getUser } from '@/lib/user-session';
import { createPayToken } from '@/lib/auth';
import { releaseExpiredOrders, payUrl } from '@/lib/payment';
import { runAssessment, evaluateRequest } from '@/lib/credit-service';
import { POLICY } from '@/lib/credit-policy';
export const dynamic = 'force-dynamic';

const bad = (error, status = 400) => Response.json({ error }, { status });

// ثبت سفارش از فروشگاه: قیمت از دیتابیس خوانده می‌شود و موجودی به‌صورت اتمیک کم می‌شود
export async function POST(req) {
  if (!(await rateLimit(req, 'orders', 10, 10 * 60_000))) return tooMany();
  let b;
  try { b = await req.json(); } catch { return bad('درخواست نامعتبر'); }

  const name = String(b?.customer?.name ?? '').trim();
  const phone = toLatinDigits(b?.customer?.phone).replace(/\s|-/g, '');
  const address = String(b?.customer?.address ?? '').trim();
  const note = String(b?.note ?? '').trim().slice(0, 500);
  const method = b?.method === 'installment' ? 'installment' : 'cash';
  const months = Number(b?.installment?.months), downPct = Number(b?.installment?.downPct);
  if (name.length < 2 || name.length > 80) return bad('نام و نام خانوادگی نامعتبر است');
  if (!/^09\d{9}$/.test(phone)) return bad('شماره موبایل نامعتبر است');
  if (address.length < 5 || address.length > 500) return bad('آدرس نامعتبر است');
  if (!Array.isArray(b.items) || b.items.length < 1 || b.items.length > 20) return bad('سبد خرید نامعتبر است');
  if (method === 'cash' && (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 16)) return bad('SESSION_SECRET تنظیم نشده است', 500);

  const wanted = new Map(); // productId -> qty (ادغام ردیف‌های تکراری)
  for (const it of b.items) {
    const qty = toInt(it?.qty, 1, 20);
    if (!mongoose.isValidObjectId(it?.productId) || qty === null) return bad('اقلام سبد نامعتبر است');
    wanted.set(String(it.productId), (wanted.get(String(it.productId)) || 0) + qty);
  }

  await connectDB();
  await releaseExpiredOrders().catch(() => {}); // آزادکردن موجودیِ سفارش‌های پرداخت‌نشده‌ی منقضی
  const user = await getUser();
  if (method === 'installment') { // خرید اقساطی فقط با حساب واردشده، موبایل تأییدشده و کد ملی ثبت‌شده
    if (!user) return bad('برای خرید اقساطی ابتدا وارد حساب شوید یا ثبت‌نام کنید', 401);
    if (!user.nationalIdMasked || !user.phoneVerified) return bad('پرونده‌ی اعتباری ناقص است: کد ملی و تأیید موبایل را در «اعتبار و اقساط» حساب خود تکمیل کنید', 403);
    if (!POLICY.monthOptions.includes(months) || !POLICY.downPaymentOptions.includes(downPct)) return bad('مدت اقساط یا پیش‌پرداخت نامعتبر است');
  }
  const taken = []; // برای برگشت در صورت خطا
  const lines = [];
  try {
    for (const [pid, qty] of wanted) {
      const p = await Product.findOneAndUpdate({ _id: pid, stock: { $gte: qty } }, { $inc: { stock: -qty, sold: qty } }, { new: true }).lean();
      if (!p) {
        const exists = await Product.findById(pid).select('name').lean();
        throw Object.assign(new Error('stock'), { userMsg: exists ? `موجودی «${exists.name}» کافی نیست` : 'یکی از کالاها پیدا نشد' });
      }
      taken.push([pid, qty]);
      lines.push({ product: p._id, name: p.name, price: p.price, qty });
    }
    const total = lines.reduce((s, l) => s + l.price * l.qty, 0);
    let credit, instPlan;
    if (method === 'installment') {
      const { profile, assessment } = await runAssessment(user.id, 'order');
      const ev = evaluateRequest({ profile, assessment, total, months, downPct });
      if (!ev.ok) throw Object.assign(new Error('credit'), { userMsg: ev.message });
      instPlan = { months, downPayment: ev.plan.downPayment, financed: ev.plan.financed, monthly: ev.plan.monthly };
      credit = { assessment: assessment._id, score: assessment.score, riskLevel: assessment.riskLevel, limit: assessment.creditLimit, recommendation: assessment.recommendation, rule: ev.rule };
    }
    let order;
    for (let attempt = 0; attempt < 5 && !order; attempt++) {
      try {
        order = await Order.create({ code: `ORD-${randomInt(100000, 999999)}`, customer: { name, phone, address }, items: lines, total, method, note: note || undefined, user: user?.id, ...(instPlan && { installment: instPlan, credit }), ...(method === 'cash' && { status: AWAITING_PAYMENT, payment: { status: 'unpaid' } }) });
      } catch (e) { if (e?.code !== 11000) throw e; }
    }
    if (!order) throw new Error('order-create-failed');
    // سفارش نقدی: کاربر به درگاه پرداخت می‌رود؛ تأیید فقط بعد از پرداخت موفق انجام می‌شود
    const pay = method === 'cash' ? payUrl(await createPayToken(String(order._id), process.env.SESSION_SECRET)) : undefined;
    return Response.json({ ok: true, code: order.code, total, payUrl: pay }, { status: 201 });
  } catch (e) {
    await Promise.all(taken.map(([pid, qty]) => Product.updateOne({ _id: pid }, { $inc: { stock: qty, sold: -qty } })));
    if (e.userMsg) return bad(e.userMsg, 409);
    console.error('orders POST:', e);
    return bad('ثبت سفارش ناموفق بود', 500);
  }
}
