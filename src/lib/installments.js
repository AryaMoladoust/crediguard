// منطق خالص (بدون دیتابیس) اقساط: خلاصه‌سازی، پرداخت زودتر/تسویه، سقف قابل‌استفاده و قوانین سفارش.
// عمداً به مدل‌ها وابسته نیست تا مستقیم با node تست شود.
import { POLICY, planOf } from './credit-policy.js';

const DAY = 86400000;
// سفارش‌هایی که پس از تأیید مدیر، پرداخت پیش‌پرداخت/اقساط برایشان مجاز است
export const PAYABLE = ['confirmed', 'shipped', 'completed'];
// سفارش‌های قدیمی بدون فیلد down «پرداخت‌شده» حساب می‌شوند تا قفل نشوند
export const downPaid = (inst) => !inst?.down?.status || inst.down.status === 'paid';
export const isOverdue = (row, now = new Date()) => row.status === 'due' && new Date(row.dueDate) < now;

// ---- ساخت جدول اقساط پس از تأیید مدیر
export function buildSchedule(inst, from = new Date()) {
  return Array.from({ length: inst.months }, (_, i) => {
    const due = new Date(from.getTime() + (POLICY.firstDueAfterDays + 30 * i) * DAY);
    const last = i === inst.months - 1;
    return { no: i + 1, dueDate: due, amount: last ? inst.financed - inst.monthly * (inst.months - 1) : inst.monthly, status: 'due' };
  });
}

// ---- خلاصه‌ی اقساط یک مشتری (برای مشتری، پنل فروشنده و پاسخ‌گوی پشتیبانی)
export function summarizeInstallments(orders, now = new Date()) {
  const plans = [], awaiting = [];
  const t = { overdueCount: 0, overdueAmount: 0, maxDaysLate: 0, totalCount: 0, paidCount: 0, paidAmount: 0, remainingCount: 0, remainingAmount: 0, downDueCount: 0, downDueAmount: 0 };
  let next = null;
  for (const o of orders) {
    const inst = o.installment;
    if (o.method !== 'installment' || !inst?.months || o.status === 'cancelled' || o.status === 'awaiting_payment') continue;
    const s = inst.schedule || [];
    if (!s.length) {
      if (o.status === 'pending') awaiting.push({ code: o.code, orderId: String(o._id), total: o.total, months: inst.months, monthly: inst.monthly, downPayment: inst.downPayment, financed: inst.financed });
      continue;
    }
    const dp = downPaid(inst);
    if (!dp) { t.downDueCount++; t.downDueAmount += inst.downPayment || 0; }
    const rows = s.map((r) => {
      const diff = new Date(r.dueDate).getTime() - now.getTime();
      const status = r.status === 'paid' ? 'paid' : isOverdue(r, now) ? 'overdue' : 'due';
      return { no: r.no, dueDate: r.dueDate, amount: r.amount, status, paidAt: r.paidAt || null,
        daysLeft: status === 'due' ? Math.ceil(diff / DAY) : null, daysLate: status === 'overdue' ? Math.floor(-diff / DAY) : null };
    });
    let remC = 0, remA = 0, paidC = 0;
    for (const r of rows) {
      t.totalCount++;
      if (r.status === 'paid') { paidC++; t.paidCount++; t.paidAmount += r.amount; continue; }
      remC++; remA += r.amount; t.remainingCount++; t.remainingAmount += r.amount;
      if (r.status === 'overdue') { t.overdueCount++; t.overdueAmount += r.amount; t.maxDaysLate = Math.max(t.maxDaysLate, r.daysLate); }
      else if (!next || new Date(r.dueDate) < new Date(next.dueDate)) next = { ...r, code: o.code };
    }
    plans.push({ code: o.code, orderId: String(o._id), orderStatus: o.status, total: o.total, months: inst.months, monthly: inst.monthly,
      down: { amount: inst.downPayment || 0, status: dp ? 'paid' : 'unpaid', paidAt: inst.down?.paidAt || null },
      paidCount: paidC, remainingCount: remC, remainingAmount: remA, schedule: rows });
  }
  return { plans, awaiting, ...t, next };
}

// ---- پرداخت با درگاه: مبلغ همیشه از روی سفارش در دیتابیس محاسبه می‌شود، نه از کلاینت
// target: down | all | n<شماره‌ی قسط>
export function planPayment(o, target) {
  const inst = o?.installment;
  if (!o || o.method !== 'installment' || !inst?.months) return { error: 'سفارش اقساطی پیدا نشد' };
  if (!PAYABLE.includes(o.status)) return { error: 'این سفارش هنوز توسط مدیر تأیید نشده است' };
  if (target === 'down') {
    if (downPaid(inst)) return { error: 'پیش‌پرداخت این سفارش قبلاً پرداخت شده است' };
    return { kind: 'down', amount: inst.downPayment, nos: [], label: `پیش‌پرداخت (قسط اول) سفارش ${o.code}` };
  }
  if (!downPaid(inst)) return { error: 'ابتدا پیش‌پرداخت (قسط اول) را پرداخت کنید' };
  const due = (inst.schedule || []).filter((r) => r.status === 'due');
  if (target === 'all') {
    if (!due.length) return { error: 'قسط پرداخت‌نشده‌ای باقی نمانده است' };
    return { kind: 'all', amount: due.reduce((s, r) => s + r.amount, 0), nos: due.map((r) => r.no), label: `تسویه‌ی ${due.length} قسط باقی‌مانده‌ی سفارش ${o.code}` };
  }
  const m = /^n(\d{1,2})$/.exec(String(target));
  if (!m) return { error: 'درخواست پرداخت نامعتبر است' };
  const row = due.find((r) => r.no === Number(m[1]));
  if (!row) return { error: 'این قسط پیدا نشد یا قبلاً پرداخت شده است' };
  return { kind: 'one', amount: row.amount, nos: [row.no], label: `قسط ${row.no} سفارش ${o.code}` };
}

// ---- تعهد جاری مشتری: مانده‌ی اقساط باز + مبلغ اقساطی سفارش‌های در انتظار تأیید
export function exposureFromOrders(orders) {
  let outstanding = 0, monthly = 0;
  for (const o of orders) {
    const inst = o.installment;
    if (o.method !== 'installment' || !inst?.months || !['pending', ...PAYABLE].includes(o.status)) continue;
    const s = inst.schedule || [];
    if (s.length) {
      const due = s.filter((r) => r.status === 'due');
      if (due.length) { outstanding += due.reduce((x, r) => x + r.amount, 0); monthly += inst.monthly || 0; }
    } else if (o.status === 'pending') { outstanding += inst.financed || 0; monthly += inst.monthly || 0; }
  }
  return { outstanding, monthly };
}

// ---- آنچه به «مشتری» نشان داده می‌شود: فقط سقف و مقدار قابل‌استفاده (نه امتیاز و تحلیل ایجنت)
export function purchaseCapacity({ profile, assessment, exposure = { outstanding: 0, monthly: 0 } }) {
  const dec = profile?.decision?.status;
  const used = exposure.outstanding || 0;
  if (dec === 'rejected' || (assessment.recommendation === 'reject' && dec !== 'approved')) return { limit: 0, used, available: 0, maxTotal: 0, blocked: true };
  const limit = assessment.creditLimit || 0;
  const available = Math.max(0, limit - used);
  const maxTotal = Math.floor(available / (1 - POLICY.minDownPaymentPct / 100) / 1000) * 1000;
  return { limit, used, available, maxTotal, blocked: available === 0 };
}

// ---- قوانین نهایی سیستم برای درخواست اقساطی (ایجنت فقط پیشنهاد می‌دهد)
export function evaluateRequest({ profile, assessment, total, downPct, months, exposure = { outstanding: 0, monthly: 0 } }) {
  if (!POLICY.monthOptions.includes(months)) return { ok: false, rule: 'bad_months', message: 'مدت اقساط نامعتبر است' };
  if (!POLICY.downPaymentOptions.includes(downPct)) return { ok: false, rule: 'bad_down', message: `پیش‌پرداخت باید یکی از ${POLICY.downPaymentOptions.map((x) => x.toLocaleString('fa-IR')).join('، ')} درصد باشد` };
  const plan = planOf(total, downPct, months);
  const available = Math.max(0, assessment.creditLimit - exposure.outstanding);
  const out = { plan, limit: assessment.creditLimit, available, recommendation: assessment.recommendation };
  const dec = profile.decision?.status;
  if (dec === 'rejected') return { ...out, ok: false, rule: 'admin_rejected', message: 'خرید اقساطی برای حساب شما فعال نیست؛ با پشتیبانی تماس بگیرید' };
  if (assessment.recommendation === 'reject' && dec !== 'approved') return { ...out, ok: false, rule: 'risk_rejected', message: 'در حال حاضر امکان خرید اقساطی برای شما وجود ندارد' };
  if (plan.financed > available && dec !== 'approved') return { ...out, ok: false, rule: 'over_limit', message: `مبلغ اقساطی (${plan.financed.toLocaleString('fa-IR')} تومان) از سقف قابل‌استفاده‌ی شما (${available.toLocaleString('fa-IR')} تومان) بیشتر است${exposure.outstanding ? ' (مانده‌ی اقساط قبلی از سقف کم شده است)' : ''}؛ پیش‌پرداخت را بیشتر کنید یا کالای دیگری انتخاب کنید` };
  const capacity = (assessment.metrics?.monthlyCapacity ?? 0) - exposure.monthly;
  if (plan.monthly > capacity && dec !== 'approved') return { ...out, ok: false, rule: 'over_capacity', message: `قسط ماهانه (${plan.monthly.toLocaleString('fa-IR')} تومان) از ظرفیت پرداخت شما بیشتر است؛ مدت اقساط را بیشتر یا پیش‌پرداخت را بالاتر انتخاب کنید` };
  const auto = assessment.recommendation === 'approve' && (!dec || dec === 'auto' || dec === 'approved');
  return { ...out, ok: true, rule: auto ? 'within_limit' : 'needs_review', message: auto ? 'درخواست شما در محدوده‌ی اعتبار است و برای تأیید نهایی به مدیر ارسال می‌شود' : 'درخواست شما برای بررسی دستی به مدیر ارسال می‌شود' };
}
