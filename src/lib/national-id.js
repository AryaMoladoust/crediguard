import { createHmac } from 'node:crypto';
import { toLatinDigits } from './catalog.js';

// اعتبارسنجی کد ملی ایران (۱۰ رقم + رقم کنترل)
export function normalizeNationalId(v) { return toLatinDigits(v).replace(/\s|-/g, ''); }
export function isValidNationalId(v) {
  const s = normalizeNationalId(v);
  if (!/^\d{10}$/.test(s) || /^(\d)\1{9}$/.test(s)) return false;
  const sum = [...s.slice(0, 9)].reduce((a, d, i) => a + Number(d) * (10 - i), 0);
  const r = sum % 11;
  const c = Number(s[9]);
  return r < 2 ? c === r : c === 11 - r;
}
const key = () => process.env.DATA_ENCRYPTION_KEY || process.env.SESSION_SECRET || '';
// کد ملی به‌صورت متن ساده ذخیره نمی‌شود: فقط HMAC (برای جلوگیری از ثبت‌نام تکراری) و نسخه‌ی ماسک‌شده
export function hashNationalId(v) {
  if (key().length < 16) throw new Error('SESSION_SECRET / DATA_ENCRYPTION_KEY تنظیم نشده است');
  return createHmac('sha256', key()).update(`nid:${normalizeNationalId(v)}`).digest('hex');
}
export const maskNationalId = (v) => { const s = normalizeNationalId(v); return `${s.slice(0, 3)}****${s.slice(-3)}`; };
