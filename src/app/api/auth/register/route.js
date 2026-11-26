import { connectDB } from '@/lib/db';
import User from '@/models/User';
import SupportConversation from '@/models/SupportConversation';
import { hashPassword } from '@/lib/password';
import { setUserCookie } from '@/lib/user-session';
import { toLatinDigits } from '@/lib/catalog';
import { rateLimit, tooMany } from '@/lib/rate-limit';
import { isValidNationalId, normalizeNationalId, hashNationalId, maskNationalId } from '@/lib/national-id';
import { runAssessment } from '@/lib/credit-service';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
const bad = (error, status = 400) => Response.json({ error }, { status });

export async function POST(req) {
  if (!(await rateLimit(req, 'register', 8, 60 * 60_000))) return tooMany();
  if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 16) return bad('SESSION_SECRET تنظیم نشده است', 500);
  let b; try { b = await req.json(); } catch { return bad('درخواست نامعتبر'); }
  const name = String(b?.name ?? '').trim();
  const phone = toLatinDigits(b?.phone).replace(/\s|-/g, '');
  const nid = normalizeNationalId(b?.nationalId);
  const email = String(b?.email ?? '').trim().toLowerCase();
  const password = String(b?.password ?? '');
  if (name.length < 2 || name.length > 80) return bad('نام و نام خانوادگی را کامل وارد کنید');
  if (!/^09\d{9}$/.test(phone)) return bad('شماره موبایل باید با ۰۹ شروع شود و ۱۱ رقم باشد');
  if (!isValidNationalId(nid)) return bad('کد ملی نامعتبر است');
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return bad('ایمیل نامعتبر است');
  if (password.length < 8 || password.length > 100) return bad('رمز عبور باید حداقل ۸ کاراکتر باشد');
  const dup = 'با این شماره یا کد ملی قبلاً ثبت‌نام شده است؛ وارد شوید';
  try {
    await connectDB();
    const nidHash = hashNationalId(nid);
    if (await User.exists({ $or: [{ phone }, { nationalIdHash: nidHash }] })) return bad(dup, 409);
    const u = await User.create({ name, phone, email: email || undefined, passwordHash: await hashPassword(password), nationalIdHash: nidHash, nationalIdMasked: maskNationalId(nid) });
    // پیام‌های فرم تماسِ قبلیِ همین شماره (شماره تأیید شده است) به حساب جدید وصل می‌شود
    await SupportConversation.updateMany({ user: { $exists: false }, 'guest.phone': phone }, { $set: { user: u._id } }).catch(() => {});
    await runAssessment(u._id, 'register').catch((e) => console.error('assessment@register:', e));
    await setUserCookie(String(u._id));
    return Response.json({ ok: true }, { status: 201 });
  } catch (e) {
    if (e?.code === 11000) return bad(dup, 409);
    console.error('register:', e);
    return bad('ثبت‌نام انجام نشد', 500);
  }
}
