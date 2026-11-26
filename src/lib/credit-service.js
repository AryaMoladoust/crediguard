import { createHash } from 'node:crypto';
import CreditProfile from '@/models/CreditProfile';
import User from '@/models/User';
import CreditAssessment from '@/models/CreditAssessment';
import { generateCreditData, generateBureauRecord, SIM_VERSION, EDITABLE, EDITABLE_BOOL } from './credit-sim';
import { analyzeCredit } from './credit-agent';
import Order from '@/models/Order';
import { exposureFromOrders, PAYABLE } from './installments.js';

// منطق خالص اقساط در installments.js است (قابل تست با node)؛ برای سازگاری از اینجا هم export می‌شود
export { summarizeInstallments, buildSchedule, isOverdue, evaluateRequest, purchaseCapacity, exposureFromOrders, planPayment, downPaid } from './installments.js';

// تعهد جاری مشتری (مانده‌ی اقساط باز + سفارش‌های در انتظار تأیید) برای سقف تجمعی
export async function exposureOf(userId) {
  const orders = await Order.find({ user: userId, method: 'installment', status: { $in: ['pending', ...PAYABLE] } }).select('status method installment').lean();
  return exposureFromOrders(orders);
}

// پروفایل آزمایشی مشتری؛ اگر نبود با شبیه‌ساز قطعی (از روی شناسه‌ی داخلی) ساخته و ذخیره می‌شود
export async function ensureProfile(userId) {
  let p = await CreditProfile.findOne({ user: userId });
  if (p?.bureau) return p;
  const u = await User.findById(userId).select('name phone address').lean();
  if (p) { // پروفایل قدیمی بدون snapshot بانکی: فقط snapshot اضافه می‌شود، data و تصمیم مدیر دست‌نخورده می‌ماند
    p.bureau = generateBureauRecord(String(userId), { fullName: u?.name, mobile: u?.phone, data: p.data });
    await p.save();
    return p;
  }
  const data = generateCreditData(String(userId));
  const bureau = generateBureauRecord(String(userId), { fullName: u?.name, mobile: u?.phone, data });
  try { p = await CreditProfile.create({ user: userId, simVersion: SIM_VERSION, data, bureau }); }
  catch (e) { if (e?.code === 11000) p = await CreditProfile.findOne({ user: userId }); else throw e; }
  return p;
}
const hashOf = (d) => createHash('sha256').update(JSON.stringify(Object.keys(d).sort().map((k) => [k, d[k]]))).digest('hex').slice(0, 32);

// تحلیل ایجنت؛ اگر داده تغییری نکرده باشد همان تحلیل قبلی برمی‌گردد (بدون ساخت رکورد تازه)
export async function runAssessment(userId, trigger = 'customer') {
  const profile = await ensureProfile(userId);
  const inputHash = hashOf(profile.data);
  const last = await CreditAssessment.findOne({ user: userId, latest: true });
  if (last && last.inputHash === inputHash) return { profile, assessment: last, fresh: false };
  const r = analyzeCredit(profile.data);
  await CreditAssessment.updateMany({ user: userId, latest: true }, { $set: { latest: false } });
  const assessment = await CreditAssessment.create({ user: userId, inputHash, trigger, ...r });
  return { profile, assessment, fresh: true };
}

// ویرایش کنترل‌شده‌ی داده‌ی آزمایشی توسط مدیر (با بازه‌ی مجاز، دلیل و سابقه)
export function cleanChanges(raw) {
  const changes = {};
  for (const [k, v] of Object.entries(raw || {})) {
    if (EDITABLE[k]) { const n = Number(v); const [lo, hi] = EDITABLE[k]; if (!Number.isFinite(n) || !Number.isInteger(n) || n < lo || n > hi) return { error: `مقدار «${k}» خارج از بازه‌ی مجاز است` }; changes[k] = n; }
    else if (EDITABLE_BOOL.includes(k)) { if (typeof v !== 'boolean') return { error: `مقدار «${k}» نامعتبر است` }; changes[k] = v; }
    else return { error: `فیلد «${k}» قابل ویرایش نیست` };
  }
  return Object.keys(changes).length ? { changes } : { error: 'تغییری ارسال نشده است' };
}
export function applyChanges(data, changes) {
  const d = { ...data, ...changes };
  const paid = d.onTimePayments + d.latePayments;
  d.goodStandingPct = paid ? Math.round((d.onTimePayments / paid) * 100) : 100;
  return d;
}
