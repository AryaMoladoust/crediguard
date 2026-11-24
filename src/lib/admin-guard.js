import { cookies } from 'next/headers';
import { COOKIE, verifyToken } from './auth';
import { connectDB } from './db';
import Admin from '@/models/Admin';

// مدیر واردشده یا null. مدیر کل (owner) از env است؛ مدیرهای دیگر هر بار از دیتابیس
// بررسی می‌شوند تا با غیرفعال/حذف‌شدن، فوراً دسترسی‌شان قطع شود.
export async function getAdmin() {
  const jar = await cookies();
  const key = await verifyToken(jar.get(COOKIE)?.value, process.env.SESSION_SECRET);
  if (!key) return null;
  if (key === 'owner') return { key, role: 'owner', name: 'مدیر کل', email: String(process.env.ADMIN_EMAIL || '').trim() };
  try {
    await connectDB();
    const a = await Admin.findById(key).select('name email active').lean();
    return a && a.active ? { key, role: 'admin', name: a.name, email: a.email } : null;
  } catch { return null; }
}
export async function isAdmin() { return !!(await getAdmin()); }
export async function isOwner() { return (await getAdmin())?.role === 'owner'; }
export const unauthorized = () => Response.json({ error: 'نیاز به ورود به پنل' }, { status: 401 });
export const forbidden = () => Response.json({ error: 'فقط مدیر کل به این بخش دسترسی دارد' }, { status: 403 });
export const bad = (error, status = 400) => Response.json({ error }, { status });
