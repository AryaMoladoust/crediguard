import { connectDB } from '@/lib/db';
import User from '@/models/User';
import { getUser } from '@/lib/user-session';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() { return Response.json({ user: await getUser() }); }

export async function PATCH(req) {
  const u = await getUser();
  if (!u) return Response.json({ error: 'وارد حساب شوید' }, { status: 401 });
  let b; try { b = await req.json(); } catch { return Response.json({ error: 'درخواست نامعتبر' }, { status: 400 }); }
  const name = String(b?.name ?? u.name).trim();
  const address = String(b?.address ?? '').trim().slice(0, 500);
  const email = String(b?.email ?? '').trim().toLowerCase().slice(0, 120);
  if (name.length < 2 || name.length > 80) return Response.json({ error: 'نام نامعتبر است' }, { status: 400 });
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return Response.json({ error: 'ایمیل نامعتبر است' }, { status: 400 });
  await connectDB();
  await User.updateOne({ _id: u.id }, { name, address, email: email || undefined });
  return Response.json({ ok: true });
}
