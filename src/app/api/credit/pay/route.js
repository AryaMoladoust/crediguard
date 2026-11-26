import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import Order from '@/models/Order';
import { getUser } from '@/lib/user-session';
import { createInstToken } from '@/lib/auth';
import { planPayment } from '@/lib/installments.js';
import { rateLimit, tooMany } from '@/lib/rate-limit';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
const err = (error, status = 400) => Response.json({ error }, { status });

// شروع پرداخت اقساط با درگاه: body = { orderId, target: 'down' | 'all' | 'n3' }
// فقط مشتری واردشده و فقط برای سفارش خودش؛ مبلغ از دیتابیس محاسبه می‌شود و از کلاینت پذیرفته نمی‌شود.
export async function POST(req) {
  if (!(await rateLimit(req, 'inst-pay', 20, 10 * 60_000))) return tooMany();
  const u = await getUser();
  if (!u) return err('وارد حساب شوید', 401);
  if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 16) return err('SESSION_SECRET تنظیم نشده است', 500);
  let b; try { b = await req.json(); } catch { return err('درخواست نامعتبر'); }
  const target = String(b?.target ?? '');
  if (!mongoose.isValidObjectId(b?.orderId) || !/^(down|all|n\d{1,2})$/.test(target)) return err('درخواست نامعتبر');
  try {
    await connectDB();
    const o = await Order.findOne({ _id: b.orderId, user: u.id }).select('code method status installment').lean();
    if (!o) return err('سفارش پیدا نشد', 404);
    const plan = planPayment(o, target);
    if (plan.error) return err(plan.error, 409);
    const token = await createInstToken(String(o._id), target, process.env.SESSION_SECRET);
    return Response.json({ ok: true, payUrl: `/pay?t=${encodeURIComponent(token)}`, amount: plan.amount, label: plan.label });
  } catch (e) { console.error('credit/pay:', e); return err('اتصال به درگاه انجام نشد', 500); }
}
