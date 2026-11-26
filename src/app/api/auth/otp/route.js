import { connectDB } from '@/lib/db';
import User from '@/models/User';
import { toLatinDigits } from '@/lib/catalog';
import { rateLimit, tooMany } from '@/lib/rate-limit';
import { issueOtp } from '@/lib/otp';
import { getUser } from '@/lib/user-session';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
const bad = (error, status = 400) => Response.json({ error }, { status });

// ارسال کد تأیید موبایل. purpose=register (بدون ورود) | verify (کاربر واردشده، برای شماره‌ی خودش)
export async function POST(req) {
  if (!(await rateLimit(req, 'otp', 8, 15 * 60_000))) return tooMany();
  if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 16) return bad('SESSION_SECRET تنظیم نشده است', 500);
  let b; try { b = await req.json(); } catch { return bad('درخواست نامعتبر'); }
  const purpose = b?.purpose === 'verify' ? 'verify' : 'register';
  const given = toLatinDigits(b?.phone).replace(/\s|-/g, '');
  if (purpose === 'register' && !/^09\d{9}$/.test(given)) return bad('شماره موبایل باید با ۰۹ شروع شود و ۱۱ رقم باشد');
  try {
    await connectDB();
    let phone;
    if (purpose === 'verify') {
      const u = await getUser();
      if (!u) return bad('ابتدا وارد حساب شوید', 401);
      phone = u.phone; // فقط برای شماره‌ی خودِ کاربر
    } else {
      phone = toLatinDigits(b?.phone).replace(/\s|-/g, '');
      if (!/^09\d{9}$/.test(phone)) return bad('شماره موبایل باید با ۰۹ شروع شود و ۱۱ رقم باشد');
      if (await User.exists({ phone })) return bad('با این شماره قبلاً ثبت‌نام شده است؛ وارد شوید', 409);
    }
    const r = await issueOtp(phone, purpose);
    if (r.error) return bad(r.error, r.status);
    return Response.json(r);
  } catch (e) {
    console.error('otp:', e);
    return bad(e.message === 'سرویس پیامک تنظیم نشده است' ? e.message : 'ارسال کد انجام نشد', 500);
  }
}
