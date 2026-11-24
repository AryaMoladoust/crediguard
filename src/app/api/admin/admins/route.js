import { connectDB } from '@/lib/db';
import Admin from '@/models/Admin';
import { getAdmin, unauthorized, forbidden, bad } from '@/lib/admin-guard';
import { hashPassword } from '@/lib/password';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const shape = (a) => ({ id: String(a._id), name: a.name, email: a.email, active: !!a.active, lastLoginAt: a.lastLoginAt || null, createdAt: a.createdAt });

// مدیریت مدیرها فقط برای مدیر کل (owner) است
async function owner() {
  const a = await getAdmin();
  return a ? (a.role === 'owner' ? a : 'forbidden') : null;
}

export async function GET() {
  const a = await owner();
  if (!a) return unauthorized();
  if (a === 'forbidden') return forbidden();
  try {
    await connectDB();
    const list = await Admin.find().sort({ createdAt: 1 }).limit(200).lean();
    return Response.json({ owner: { email: a.email, name: a.name }, admins: list.map(shape) });
  } catch (e) {
    console.error('admins GET:', e);
    return bad('خطای سرور', 500);
  }
}

export async function POST(req) {
  const a = await owner();
  if (!a) return unauthorized();
  if (a === 'forbidden') return forbidden();
  let b;
  try { b = await req.json(); } catch { return bad('درخواست نامعتبر'); }
  const name = String(b?.name ?? '').trim();
  const email = String(b?.email ?? '').trim().toLowerCase();
  const password = String(b?.password ?? '');
  if (name.length < 2 || name.length > 80) return bad('نام مدیر را وارد کنید (۲ تا ۸۰ کاراکتر)');
  if (!EMAIL_RE.test(email) || email.length > 120) return bad('ایمیل نامعتبر است');
  if (password.length < 8 || password.length > 100) return bad('رمز عبور باید حداقل ۸ کاراکتر باشد');
  if (email === String(process.env.ADMIN_EMAIL || '').trim().toLowerCase()) return bad('این ایمیل متعلق به مدیر کل است', 409);
  try {
    await connectDB();
    if (await Admin.exists({ email })) return bad('مدیری با این ایمیل قبلاً ثبت شده است', 409);
    const doc = await Admin.create({ name, email, passwordHash: await hashPassword(password) });
    return Response.json(shape(doc.toObject()), { status: 201 });
  } catch (e) {
    if (e?.code === 11000) return bad('مدیری با این ایمیل قبلاً ثبت شده است', 409);
    console.error('admins POST:', e);
    return bad('خطای سرور', 500);
  }
}
