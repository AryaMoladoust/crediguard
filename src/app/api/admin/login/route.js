import { cookies } from 'next/headers';
import { COOKIE, MAX_AGE, createToken, checkCredentials } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { verifyPassword } from '@/lib/password';
import { rateLimit, tooMany } from '@/lib/rate-limit';
import Admin from '@/models/Admin';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// ورود مدیر: ابتدا مدیر کل (ADMIN_EMAIL / ADMIN_PASSWORD در env)، سپس مدیرهای ثبت‌شده در دیتابیس.
// نشست‌ها بدون حالت (stateless) هستند، پس چند مدیر می‌توانند هم‌زمان وارد باشند.
export async function POST(req) {
  const { ADMIN_EMAIL, ADMIN_PASSWORD, SESSION_SECRET } = process.env;
  if (!SESSION_SECRET || SESSION_SECRET.length < 16) {
    return Response.json({ error: 'متغیر SESSION_SECRET تنظیم نشده است (حداقل ۱۶ کاراکتر)' }, { status: 500 });
  }
  if (!(await rateLimit(req, 'admin-login', 10, 15 * 60_000))) return tooMany();
  let body = {};
  try { body = await req.json(); } catch {}
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';

  let key = null;
  if (email && password && password.length <= 200) {
    if (ADMIN_EMAIL && ADMIN_PASSWORD && (await checkCredentials(email, password))) key = 'owner';
    else {
      try {
        await connectDB();
        const a = await Admin.findOne({ email });
        const ok = await verifyPassword(password, a?.passwordHash);
        if (a && a.active && ok) {
          key = String(a._id);
          Admin.updateOne({ _id: a._id }, { lastLoginAt: new Date() }).catch(() => {});
        }
      } catch (e) {
        console.error('admin login:', e);
        return Response.json({ error: 'خطای سرور' }, { status: 500 });
      }
    }
  }
  if (!key) {
    await new Promise((r) => setTimeout(r, 800)); // کند کردن حدس‌زدن رمز
    return Response.json({ error: 'ایمیل یا رمز عبور اشتباه است' }, { status: 401 });
  }
  const jar = await cookies();
  jar.set(COOKIE, await createToken(SESSION_SECRET, key), {
    httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: MAX_AGE
  });
  return Response.json({ ok: true });
}
