import { connectDB } from '@/lib/db';
import { getUser } from '@/lib/user-session';
import { rateLimit, tooMany } from '@/lib/rate-limit';
import { customerCredit } from '@/lib/customer-credit';
import { POLICY } from '@/lib/credit-policy';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// سقف خرید اقساطی و اقساط مشتریِ واردشده؛ GET و POST هر دو فقط داده‌ی همان کاربر را می‌دهند.
async function handle(req) {
  const u = await getUser();
  if (!u) return Response.json({ error: 'وارد حساب شوید' }, { status: 401 });
  try {
    await connectDB();
    const c = await customerCredit(u);
    // به مشتری فقط «چقدر می‌تواند اقساطی بخرد» و جدول اقساطش داده می‌شود؛
    // امتیاز، ریسک، تحلیل ایجنت و اطلاعات اعتباری فقط در پنل فروشنده دیده می‌شود.
    return Response.json({
      ready: c.ready, user: { name: u.name, phone: u.phone, nationalId: u.nationalIdMasked },
      policy: { months: POLICY.monthOptions, downPct: POLICY.downPaymentOptions },
      purchase: c.purchase || null,
      installments: c.installments
    });
  } catch (e) { console.error('credit/me:', e); return Response.json({ error: 'خطای سرور' }, { status: 500 }); }
}
export const GET = handle;
export async function POST(req) { if (!(await rateLimit(req, 'credit-check', 20, 10 * 60_000))) return tooMany(); return handle(req); }
