import { connectDB } from '@/lib/db';
import User from '@/models/User';
import { getUser, setUserCookie } from '@/lib/user-session';
import { hashPassword, verifyPassword } from '@/lib/password';
import { rateLimit, tooMany } from '@/lib/rate-limit';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
const err = (error, status = 400) => Response.json({ error }, { status });

// تغییر رمز: همه‌ی نشست‌های قبلی باطل می‌شود و نشست فعلی تازه صادر می‌شود
export async function POST(req) {
  if (!(await rateLimit(req, 'pw', 8, 15 * 60_000))) return tooMany();
  const u = await getUser();
  if (!u) return err('وارد حساب شوید', 401);
  let b; try { b = await req.json(); } catch { return err('درخواست نامعتبر'); }
  const next = String(b?.next ?? '');
  if (next.length < 8 || next.length > 100) return err('رمز جدید باید حداقل ۸ کاراکتر باشد');
  await connectDB();
  const doc = await User.findById(u.id);
  if (!doc || !(await verifyPassword(String(b?.current ?? ''), doc.passwordHash))) { await new Promise((r) => setTimeout(r, 600)); return err('رمز فعلی اشتباه است', 401); }
  doc.passwordHash = await hashPassword(next);
  doc.passwordChangedAt = new Date(Date.now() - 2000);
  await doc.save();
  await setUserCookie(String(doc._id));
  return Response.json({ ok: true });
}
