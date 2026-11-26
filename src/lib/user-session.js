import { cookies } from 'next/headers';
import { USER_COOKIE, MAX_AGE, createUserToken, verifyUserSession } from './auth';
import { connectDB } from './db';
import User from '@/models/User';

// کاربر واردشده (یا null)؛ فقط فیلدهای عمومی برگردانده می‌شود
export async function getUser() {
  try {
    const jar = await cookies();
    const s = await verifyUserSession(jar.get(USER_COOKIE)?.value, process.env.SESSION_SECRET);
    if (!s) return null;
    await connectDB();
    const u = await User.findById(s.uid).select('name phone email address nationalIdMasked passwordChangedAt').lean();
    if (!u) return null;
    if (u.passwordChangedAt && u.passwordChangedAt.getTime() / 1000 > s.iat + 1) return null; // نشست قبل از تغییر رمز
    return { id: String(u._id), name: u.name, phone: u.phone, email: u.email || '', address: u.address || '', nationalIdMasked: u.nationalIdMasked || '' };
  } catch { return null; }
}

export async function setUserCookie(uid) {
  const jar = await cookies();
  jar.set(USER_COOKIE, await createUserToken(uid, process.env.SESSION_SECRET), {
    httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: MAX_AGE * 4
  });
}
export async function clearUserCookie() { (await cookies()).delete(USER_COOKIE); }
