import { randomBytes, scrypt as _scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
const scrypt = promisify(_scrypt);
// ذخیره‌ی رمز با scrypt و salt تصادفی؛ قالب: salt:hash (hex)
export async function hashPassword(pw) {
  const salt = randomBytes(16);
  const hash = await scrypt(pw, salt, 64);
  return `${salt.toString('hex')}:${hash.toString('hex')}`;
}
export async function verifyPassword(pw, stored) {
  const [s, h] = String(stored || '').split(':');
  if (!s || !h) return false;
  const hash = await scrypt(pw, Buffer.from(s, 'hex'), 64);
  const known = Buffer.from(h, 'hex');
  return known.length === hash.length && timingSafeEqual(known, hash);
}
