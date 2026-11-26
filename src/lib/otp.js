import { createHmac, timingSafeEqual } from 'node:crypto';
import PhoneOtp from '@/models/PhoneOtp';
import { sendSms, randomCode, otpSimulatorOn } from './sms';
const TTL = 5 * 60_000, COOLDOWN = 60_000, MAX_ATTEMPTS = 5;
const h = (phone, purpose, code) => createHmac('sha256', process.env.SESSION_SECRET || '').update(`otp:${phone}:${purpose}:${code}`).digest('hex');

export async function issueOtp(phone, purpose) {
  const cur = await PhoneOtp.findOne({ phone, purpose }).lean();
  if (cur && Date.now() - cur.lastSentAt.getTime() < COOLDOWN) return { error: `لطفاً ${Math.ceil((COOLDOWN - (Date.now() - cur.lastSentAt.getTime())) / 1000).toLocaleString('fa-IR')} ثانیه دیگر دوباره تلاش کنید`, status: 429 };
  const code = randomCode();
  await sendSms(phone, `کد تأیید اعتبار یار: ${code}`);
  await PhoneOtp.findOneAndUpdate({ phone, purpose }, { codeHash: h(phone, purpose, code), attempts: 0, lastSentAt: new Date(), expiresAt: new Date(Date.now() + TTL) }, { upsert: true });
  // هرگز کد OTP را در پاسخ API محیط production افشا نکن؛ حتی اگر شبیه‌ساز صریحاً روشن باشد.
  const exposeDevCode = process.env.NODE_ENV !== 'production' && otpSimulatorOn();
  return { ok: true, expiresIn: TTL / 1000, ...(exposeDevCode && { devCode: code }) };
}
// true = معتبر و مصرف شد؛ حذف اتمیک مانع مصرف هم‌زمان یک کد در چند درخواست می‌شود.
export async function consumeOtp(phone, purpose, code) {
  const now = new Date();
  const codeHash = h(phone, purpose, String(code ?? '').trim());

  // فقط یک درخواست می‌تواند سند منطبق را حذف و کد را مصرف کند.
  const consumed = await PhoneOtp.findOneAndDelete({
    phone,
    purpose,
    codeHash,
    expiresAt: { $gt: now },
    attempts: { $lt: MAX_ATTEMPTS }
  });
  if (consumed) return true;

  // کد اشتباه، منقضی یا تمام‌شده معتبر نیست؛ تلاش ناموفق فقط روی OTP فعال شمرده می‌شود.
  const current = await PhoneOtp.findOne({
    phone,
    purpose,
    expiresAt: { $gt: now },
    attempts: { $lt: MAX_ATTEMPTS }
  }).select('_id').lean();
  if (current) {
    await PhoneOtp.updateOne(
      { _id: current._id, expiresAt: { $gt: now }, attempts: { $lt: MAX_ATTEMPTS } },
      { $inc: { attempts: 1 } }
    );
  }
  return false;
}
