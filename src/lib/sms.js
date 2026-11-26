import { randomInt } from 'node:crypto';
// لایه‌ی پیامک: امروز شبیه‌ساز؛ برای سرویس واقعی فقط یک provider به PROVIDERS اضافه و SMS_PROVIDER را تنظیم کنید.
const PROVIDERS = {
  // مثال: kavenegar: async (phone, text) => { await fetch(...); }
};
export function otpSimulatorOn() {
  if (process.env.SMS_PROVIDER) return false;
  return process.env.OTP_SIMULATOR === 'on' || process.env.NODE_ENV !== 'production';
}
export async function sendSms(phone, text) {
  const name = process.env.SMS_PROVIDER;
  if (name) {
    if (!PROVIDERS[name]) throw new Error(`SMS_PROVIDER «${name}» پیاده‌سازی نشده است`);
    await PROVIDERS[name](phone, text);
    return { simulated: false };
  }
  if (!otpSimulatorOn()) throw new Error('سرویس پیامک تنظیم نشده است');
  console.info(`[SMS-simulator] ${phone}: ${text}`);
  return { simulated: true };
}
export const randomCode = () => String(randomInt(10000, 100000));
