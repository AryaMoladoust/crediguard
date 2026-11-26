import { connectDB } from '@/lib/db';
import User from '@/models/User';
import { getUser } from '@/lib/user-session';
import { rateLimit, tooMany } from '@/lib/rate-limit';
import { isValidNationalId, normalizeNationalId, hashNationalId, maskNationalId } from '@/lib/national-id';
import { runAssessment } from '@/lib/credit-service';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
const err = (error, status = 400) => Response.json({ error }, { status });

export async function GET() { return Response.json({ user: await getUser() }); }

export async function PATCH(req) {
  const u = await getUser();
  if (!u) return err('وارد حساب شوید', 401);
  let b; try { b = await req.json(); } catch { return err('درخواست نامعتبر'); }
  const name = String(b?.name ?? u.name).trim();
  const address = String(b?.address ?? '').trim().slice(0, 500);
  const email = String(b?.email ?? '').trim().toLowerCase().slice(0, 120);
  if (name.length < 2 || name.length > 80) return err('نام نامعتبر است');
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return err('ایمیل نامعتبر است');
  await connectDB();
  const set = { name, address, email: email || undefined };

  // تکمیل پرونده‌ی اعتباری برای حساب‌های قدیمی: کد ملی (یک‌بار، غیرقابل تغییر توسط مشتری)
  if (b?.nationalId) {
    if (!(await rateLimit(req, 'nid', 10, 60 * 60_000))) return tooMany();
    if (u.nationalIdMasked) return err('کد ملی قبلاً ثبت شده و فقط با پشتیبانی قابل تغییر است');
    const nid = normalizeNationalId(b.nationalId);
    if (!isValidNationalId(nid)) return err('کد ملی نامعتبر است');
    const hash = hashNationalId(nid);
    if (await User.exists({ nationalIdHash: hash, _id: { $ne: u.id } })) return err('این کد ملی برای حساب دیگری ثبت شده است', 409);
    Object.assign(set, { nationalIdHash: hash, nationalIdMasked: maskNationalId(nid) });
  }
  try { await User.updateOne({ _id: u.id }, { $set: set, ...(email ? {} : { $unset: { email: 1 } }) }); }
  catch (e) { if (e?.code === 11000) return err('این کد ملی برای حساب دیگری ثبت شده است', 409); throw e; }
  if (set.nationalIdHash) await runAssessment(u.id, 'register').catch((e) => console.error('assessment@me:', e));
  return Response.json({ ok: true });
}
