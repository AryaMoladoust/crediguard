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
  return { ok: true, expiresIn: TTL / 1000, ...(otpSimulatorOn() && { devCode: code }) };
}
// true = معتبر و مصرف شد
export async function consumeOtp(phone, purpose, code) {
  const d = await PhoneOtp.findOne({ phone, purpose });
  if (!d || d.expiresAt < new Date() || d.attempts >= MAX_ATTEMPTS) return false;
  const a = Buffer.from(h(phone, purpose, String(code ?? '').trim())), b = Buffer.from(d.codeHash);
  if (a.length !== b.length || !timingSafeEqual(a, b)) { await PhoneOtp.updateOne({ _id: d._id }, { $inc: { attempts: 1 } }); return false; }
  await PhoneOtp.deleteOne({ _id: d._id });
  return true;
}
