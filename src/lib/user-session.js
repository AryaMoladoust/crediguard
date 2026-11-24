import { cookies } from 'next/headers';
import { USER_COOKIE, MAX_AGE, createUserToken, verifyUserToken } from './auth';
import { connectDB } from './db';
import User from '@/models/User';

// کاربر واردشده (یا null)؛ فقط فیلدهای عمومی برگردانده می‌شود
export async function getUser() {
  try {
    const jar = await cookies();
    const uid = await verifyUserToken(jar.get(USER_COOKIE)?.value, process.env.SESSION_SECRET);
    if (!uid) return null;
    await connectDB();
    const u = await User.findById(uid).select('name phone email address').lean();
    return u ? { id: String(u._id), name: u.name, phone: u.phone, email: u.email || '', address: u.address || '' } : null;
  } catch { return null; }
}

export async function setUserCookie(uid) {
  const jar = await cookies();
  jar.set(USER_COOKIE, await createUserToken(uid, process.env.SESSION_SECRET), {
    httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: MAX_AGE * 4
  });
}
export async function clearUserCookie() { (await cookies()).delete(USER_COOKIE); }
