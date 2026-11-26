import { connectDB } from '@/lib/db';
import { getUser } from '@/lib/user-session';
import { rateLimit, tooMany } from '@/lib/rate-limit';
import { runAssessment, evaluateRequest } from '@/lib/credit-service';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// پیش‌نمایش امکان خرید اقساطی در صفحه‌ی پرداخت (مبلغ فقط برای نمایش است؛ در ثبت سفارش دوباره از قیمت دیتابیس محاسبه می‌شود)
export async function POST(req) {
  if (!(await rateLimit(req, 'elig', 60, 10 * 60_000))) return tooMany();
  const u = await getUser();
  if (!u) return Response.json({ error: 'برای خرید اقساطی وارد حساب شوید' }, { status: 401 });
  if (!u.nationalIdMasked || !u.phoneVerified) return Response.json({ error: 'پرونده‌ی اعتباری ناقص است: کد ملی و تأیید موبایل را در «اعتبار و اقساط» تکمیل کنید', needsProfile: true }, { status: 403 });
  let b; try { b = await req.json(); } catch { return Response.json({ error: 'درخواست نامعتبر' }, { status: 400 }); }
  const total = Number(b?.total), months = Number(b?.months), downPct = Number(b?.downPct);
  if (!Number.isFinite(total) || total <= 0 || total > 5e9) return Response.json({ error: 'مبلغ نامعتبر' }, { status: 400 });
  await connectDB();
  const { profile, assessment } = await runAssessment(u.id, 'customer');
  const r = evaluateRequest({ profile, assessment, total, months, downPct });
  return Response.json({ ok: r.ok, message: r.message, plan: r.plan, limit: r.limit, rule: r.rule });
}
