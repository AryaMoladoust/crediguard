import { randomInt } from 'node:crypto';
import { connectDB } from '@/lib/db';
import Order, { AWAITING_PAYMENT } from '@/models/Order';
import { verifyPayToken, verifyInstToken } from '@/lib/auth';
import { settleInstallment } from '@/lib/installment-pay';
import { releaseExpiredOrders } from '@/lib/payment';
import { rateLimit, tooMany } from '@/lib/rate-limit';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const bad = (error, status = 400) => Response.json({ ok: false, error }, { status });

// پرداخت اقساط (پیش‌پرداخت، یک قسط، تسویه‌ی همه): توکن q1 از /api/credit/pay صادر می‌شود
async function payInstallment(token, result) {
  const t = await verifyInstToken(token, process.env.SESSION_SECRET);
  if (!t) return bad('لینک پرداخت نامعتبر یا منقضی شده است', 401);
  if (result !== 'success') return Response.json({ ok: false, error: 'پرداخت انجام نشد' });
  try {
    await connectDB();
    const r = await settleInstallment(t.oid, t.target);
    if (!r.ok) return bad(r.error, r.status);
    return Response.json({ ok: true, code: r.code, ref: r.ref, amount: r.amount, kind: r.kind });
  } catch (e) { console.error('installment verify:', e); return bad('خطای سرور', 500); }
}

// نتیجه‌ی پرداخت از شبیه‌ساز درگاه. هنگام وصل‌شدن به درگاه واقعی، این مسیر باید به callback/verify
// سمت سرور همان درگاه تبدیل شود (نتیجه را هرگز از مرورگر قبول نکنید).
// برای غیرفعال‌کردن شبیه‌ساز در محیط واقعی: PAYMENT_SIMULATOR=off
export async function POST(req) {
  if (process.env.PAYMENT_SIMULATOR === 'off') return bad('شبیه‌ساز درگاه غیرفعال است', 503);
  if (!(await rateLimit(req, 'pay', 30, 10 * 60_000))) return tooMany();
  let b; try { b = await req.json(); } catch { return bad('درخواست نامعتبر'); }
  const rawToken = String(b?.token ?? '');
  if (rawToken.startsWith('q1.')) return payInstallment(rawToken, b?.result);
  const oid = await verifyPayToken(rawToken, process.env.SESSION_SECRET);
  if (!oid) return bad('لینک پرداخت نامعتبر یا منقضی شده است', 401);
  const success = b?.result === 'success';
  try {
    await connectDB();
    await releaseExpiredOrders().catch(() => {});
    if (!success) {
      await Order.updateOne({ _id: oid, status: AWAITING_PAYMENT }, { $set: { 'payment.status': 'failed' } });
      return Response.json({ ok: false, error: 'پرداخت انجام نشد' });
    }
    const ref = `SIM-${randomInt(10000000, 99999999)}`;
    // تأیید خودکار: فقط سفارش نقدیِ در انتظار پرداخت، و فقط یک‌بار
    const o = await Order.findOneAndUpdate(
      { _id: oid, method: 'cash', status: AWAITING_PAYMENT },
      { $set: { status: 'confirmed', 'payment.status': 'paid', 'payment.ref': ref, 'payment.paidAt': new Date() } },
      { new: true }
    ).lean();
    if (o) return Response.json({ ok: true, code: o.code, ref });
    const cur = await Order.findById(oid).select('code payment').lean();
    if (cur?.payment?.status === 'paid') return Response.json({ ok: true, code: cur.code, ref: cur.payment.ref }); // درخواست تکراری
    return bad('این سفارش دیگر قابل پرداخت نیست (مهلت پرداخت تمام شده یا لغو شده است)', 409);
  } catch (e) {
    console.error('payment verify:', e);
    return bad('خطای سرور', 500);
  }
}
