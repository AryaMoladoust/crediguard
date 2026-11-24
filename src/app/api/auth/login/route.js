import { connectDB } from '@/lib/db';
import User from '@/models/User';
import { verifyPassword } from '@/lib/password';
import { setUserCookie } from '@/lib/user-session';
import { toLatinDigits } from '@/lib/catalog';
import { rateLimit, tooMany } from '@/lib/rate-limit';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req) {
  if (!rateLimit(req, 'login', 10, 15 * 60_000)) return tooMany();
  let b; try { b = await req.json(); } catch { return Response.json({ error: 'درخواست نامعتبر' }, { status: 400 }); }
  const phone = toLatinDigits(b?.phone).replace(/\s|-/g, '');
  const password = String(b?.password ?? '');
  try {
    await connectDB();
    const u = /^09\d{9}$/.test(phone) ? await User.findOne({ phone }) : null;
    const ok = u && (await verifyPassword(password, u.passwordHash));
    if (!ok) { await new Promise((r) => setTimeout(r, 600)); return Response.json({ error: 'شماره موبایل یا رمز عبور اشتباه است' }, { status: 401 }); }
    await setUserCookie(String(u._id));
    return Response.json({ ok: true });
  } catch (e) {
    console.error('login:', e);
    return Response.json({ error: 'ورود انجام نشد' }, { status: 500 });
  }
}
