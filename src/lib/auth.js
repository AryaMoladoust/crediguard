// احراز هویت ساده‌ی ادمین با کوکی امضاشده (HMAC-SHA256) — بدون وابستگی خارجی.
// با Web Crypto نوشته شده تا هم در Middleware (Edge) و هم در Route Handler (Node) کار کند.
export const COOKIE = 'cy_admin';
export const MAX_AGE = 60 * 60 * 24 * 7; // ۷ روز

const enc = new TextEncoder();
const b64url = (buf) =>
  btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

async function hmac(data, secret) {
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return b64url(await crypto.subtle.sign('HMAC', key, enc.encode(data)));
}
const sha = async (s) => b64url(await crypto.subtle.digest('SHA-256', enc.encode(s)));

export function safeEqual(a, b) {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

export async function createToken(secret) {
  const payload = `v1.${Math.floor(Date.now() / 1000) + MAX_AGE}`;
  return `${payload}.${await hmac(payload, secret)}`;
}

export async function verifyToken(token, secret) {
  if (!token || !secret || secret.length < 16) return false;
  const i = token.lastIndexOf('.');
  if (i < 0) return false;
  const payload = token.slice(0, i);
  const [ver, exp] = payload.split('.');
  if (ver !== 'v1' || !(Number(exp) > Date.now() / 1000)) return false;
  return safeEqual(token.slice(i + 1), await hmac(payload, secret));
}

export async function checkCredentials(email, password) {
  const e = safeEqual(await sha(email.trim().toLowerCase()), await sha(String(process.env.ADMIN_EMAIL).trim().toLowerCase()));
  const p = safeEqual(await sha(password), await sha(String(process.env.ADMIN_PASSWORD)));
  return e && p;
}

// ---- نشست مشتری (جدا از ادمین): u1.<userId>.<exp>.<sig>
export const USER_COOKIE = 'mb_user';
export async function createUserToken(uid, secret) {
  const payload = `u1.${uid}.${Math.floor(Date.now() / 1000) + MAX_AGE * 4}`;
  return `${payload}.${await hmac(payload, secret)}`;
}
export async function verifyUserToken(token, secret) {
  if (!token || !secret || secret.length < 16) return null;
  const i = token.lastIndexOf('.');
  if (i < 0) return null;
  const payload = token.slice(0, i);
  const [ver, uid, exp] = payload.split('.');
  if (ver !== 'u1' || !/^[0-9a-f]{24}$/.test(uid || '') || !(Number(exp) > Date.now() / 1000)) return null;
  return safeEqual(token.slice(i + 1), await hmac(payload, secret)) ? uid : null;
}

// ---- توکن پرداخت (سفارش نقدی): p1.<orderId>.<exp>.<sig> — ۳۰ دقیقه اعتبار
export const PAY_WINDOW_SEC = 30 * 60;
export async function createPayToken(oid, secret) {
  const payload = `p1.${oid}.${Math.floor(Date.now() / 1000) + PAY_WINDOW_SEC}`;
  return `${payload}.${await hmac(payload, secret)}`;
}
export async function verifyPayToken(token, secret) {
  if (!token || !secret || secret.length < 16) return null;
  const i = token.lastIndexOf('.');
  if (i < 0) return null;
  const payload = token.slice(0, i);
  const [ver, oid, exp] = payload.split('.');
  if (ver !== 'p1' || !/^[0-9a-f]{24}$/.test(oid || '') || !(Number(exp) > Date.now() / 1000)) return null;
  return safeEqual(token.slice(i + 1), await hmac(payload, secret)) ? oid : null;
}
