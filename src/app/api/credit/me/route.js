import { connectDB } from '@/lib/db';
import { getUser } from '@/lib/user-session';
import { rateLimit, tooMany } from '@/lib/rate-limit';
import { customerCredit, publicAssessment } from '@/lib/customer-credit';
import { SIM_NOTICE, POLICY } from '@/lib/credit-policy';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// پرونده‌ی اعتباری و اقساط مشتریِ واردشده؛ GET و POST هر دو فقط داده‌ی همان کاربر را می‌دهند.
// داده‌ی آزمایشی قطعی است: تکرار درخواست نتیجه را تغییر نمی‌دهد.
async function handle(req) {
  const u = await getUser();
  if (!u) return Response.json({ error: 'وارد حساب شوید' }, { status: 401 });
  try {
    await connectDB();
    const c = await customerCredit(u);
    const d = c.profile?.data;
    return Response.json({
      ready: c.ready, user: { name: u.name, phone: u.phone, nationalId: u.nationalIdMasked },
      notice: SIM_NOTICE, policy: { months: POLICY.monthOptions, downPct: POLICY.downPaymentOptions },
      profile: d && { synthetic: true, simulated: d, decision: c.profile.decision?.status || 'auto', decisionNote: c.profile.decision?.status !== 'auto' ? c.profile.decision?.note || '' : '' },
      assessment: publicAssessment(c.assessment),
      installments: c.installments
    });
  } catch (e) { console.error('credit/me:', e); return Response.json({ error: 'خطای سرور' }, { status: 500 }); }
}
export const GET = handle;
export async function POST(req) { if (!(await rateLimit(req, 'credit-check', 20, 10 * 60_000))) return tooMany(); return handle(req); }
