import { createHash } from 'node:crypto';
import CreditProfile from '@/models/CreditProfile';
import CreditAssessment from '@/models/CreditAssessment';
import { generateCreditData, SIM_VERSION, EDITABLE, EDITABLE_BOOL } from './credit-sim';
import { analyzeCredit } from './credit-agent';
import { POLICY, planOf } from './credit-policy';

// پروفایل آزمایشی مشتری؛ اگر نبود با شبیه‌ساز قطعی (از روی شناسه‌ی داخلی) ساخته و ذخیره می‌شود
export async function ensureProfile(userId) {
  let p = await CreditProfile.findOne({ user: userId });
  if (p) return p;
  try { p = await CreditProfile.create({ user: userId, simVersion: SIM_VERSION, data: generateCreditData(String(userId)) }); }
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

// قوانین نهایی سیستم برای درخواست اقساطی. ایجنت فقط «پیشنهاد» می‌دهد؛ اینجا قانون ثابت اعمال می‌شود
// و خروجی هرگز داده‌ی مالی را تغییر نمی‌دهد. ثبت سفارش همیشه در وضعیت «در انتظار» برای تأیید مدیر می‌ماند.
export function evaluateRequest({ profile, assessment, total, downPct, months }) {
  if (!POLICY.monthOptions.includes(months)) return { ok: false, rule: 'bad_months', message: 'مدت اقساط نامعتبر است' };
  if (!POLICY.downPaymentOptions.includes(downPct)) return { ok: false, rule: 'bad_down', message: `پیش‌پرداخت باید یکی از ${POLICY.downPaymentOptions.map((x) => x.toLocaleString('fa-IR')).join('، ')} درصد باشد` };
  const plan = planOf(total, downPct, months);
  const out = { plan, limit: assessment.creditLimit, recommendation: assessment.recommendation };
  const dec = profile.decision?.status;
  if (dec === 'rejected') return { ...out, ok: false, rule: 'admin_rejected', message: 'خرید اقساطی برای حساب شما توسط مدیر فعال نیست؛ با پشتیبانی تماس بگیرید' };
  if (assessment.recommendation === 'reject' && dec !== 'approved') return { ...out, ok: false, rule: 'risk_rejected', message: 'بر اساس بررسی اعتباری آزمایشی، امکان خرید اقساطی در حال حاضر برای شما وجود ندارد' };
  if (plan.financed > assessment.creditLimit && dec !== 'approved') return { ...out, ok: false, rule: 'over_limit', message: `مبلغ اقساطی (${plan.financed.toLocaleString('fa-IR')} تومان) از سقف اعتبار شما (${assessment.creditLimit.toLocaleString('fa-IR')} تومان) بیشتر است؛ پیش‌پرداخت را بیشتر کنید یا کالای دیگری انتخاب کنید` };
  const capacity = assessment.metrics?.monthlyCapacity ?? 0;
  if (plan.monthly > capacity && dec !== 'approved') return { ...out, ok: false, rule: 'over_capacity', message: `قسط ماهانه (${plan.monthly.toLocaleString('fa-IR')} تومان) از ظرفیت پرداخت شما بیشتر است؛ مدت اقساط را بیشتر یا پیش‌پرداخت را بالاتر انتخاب کنید` };
  const auto = assessment.recommendation === 'approve' && (!dec || dec === 'auto' || dec === 'approved');
  return { ...out, ok: true, rule: auto ? 'within_limit' : 'needs_review', message: auto ? 'درخواست شما در محدوده‌ی اعتبار است و برای تأیید نهایی به مدیر ارسال می‌شود' : 'درخواست شما برای بررسی دستی به مدیر ارسال می‌شود' };
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

// ---- اقساط: ساخت جدول پس از تأیید مدیر، و وضعیت «معوق» به‌صورت محاسباتی
export function buildSchedule(inst, from = new Date()) {
  return Array.from({ length: inst.months }, (_, i) => {
    const due = new Date(from.getTime() + (POLICY.firstDueAfterDays + 30 * i) * 86400000);
    const last = i === inst.months - 1;
    return { no: i + 1, dueDate: due, amount: last ? inst.financed - inst.monthly * (inst.months - 1) : inst.monthly, status: 'due' };
  });
}
export const isOverdue = (row, now = new Date()) => row.status === 'due' && new Date(row.dueDate) < now;
export function summarizeInstallments(orders, now = new Date()) {
  const out = []; let overdueCount = 0, overdueAmount = 0, next = null;
  for (const o of orders) {
    const s = o.installment?.schedule || [];
    if (!s.length) continue;
    for (const r of s) {
      if (isOverdue(r, now)) { overdueCount++; overdueAmount += r.amount; }
      else if (r.status === 'due' && (!next || new Date(r.dueDate) < new Date(next.dueDate))) next = { ...r, code: o.code };
    }
    out.push({ code: o.code, orderId: String(o._id), total: o.total, months: o.installment.months, monthly: o.installment.monthly,
      paidCount: s.filter((r) => r.status === 'paid').length,
      schedule: s.map((r) => ({ no: r.no, dueDate: r.dueDate, amount: r.amount, status: r.status === 'paid' ? 'paid' : isOverdue(r, now) ? 'overdue' : 'due', paidAt: r.paidAt || null })) });
  }
  return { plans: out, overdueCount, overdueAmount, next };
}
