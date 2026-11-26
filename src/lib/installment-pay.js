import { randomInt } from 'node:crypto';
import Order from '@/models/Order';
import { PAYABLE, planPayment } from './installments.js';

// تسویه‌ی پرداخت موفق درگاه برای پیش‌پرداخت، یک قسط (در هر تاریخ، حتی زودتر) یا همه‌ی اقساط باقی‌مانده.
// هر مرحله شرط روی خود سند دارد؛ پس درخواست تکراری/هم‌زمان یک قسط را دوبار پرداخت‌شده ثبت نمی‌کند.
export async function settleInstallment(oid, target) {
  const o = await Order.findById(oid).select('code method status installment').lean();
  const plan = planPayment(o, target);
  if (plan.error) return { ok: false, status: 409, error: plan.error };
  const ref = `SIM-${randomInt(10000000, 99999999)}`;
  const now = new Date();
  const base = { _id: oid, method: 'installment', status: { $in: PAYABLE } };
  const paid = (p) => ({ [`${p}.status`]: 'paid', [`${p}.paidAt`]: now });
  let before;
  if (plan.kind === 'down') {
    before = await Order.findOneAndUpdate({ ...base, 'installment.down.status': 'unpaid' },
      { $set: { ...paid('installment.down'), 'installment.down.ref': ref } }, { new: false }).lean();
  } else if (plan.kind === 'all') {
    before = await Order.findOneAndUpdate({ ...base, 'installment.schedule': { $elemMatch: { status: 'due' } } },
      { $set: { 'installment.schedule.$[r].status': 'paid', 'installment.schedule.$[r].paidAt': now, 'installment.schedule.$[r].paidBy': 'gateway', 'installment.schedule.$[r].payRef': ref } },
      { new: false, arrayFilters: [{ 'r.status': 'due' }] }).lean();
  } else {
    before = await Order.findOneAndUpdate({ ...base, 'installment.schedule': { $elemMatch: { no: plan.nos[0], status: 'due' } } },
      { $set: { 'installment.schedule.$.status': 'paid', 'installment.schedule.$.paidAt': now, 'installment.schedule.$.paidBy': 'gateway', 'installment.schedule.$.payRef': ref } },
      { new: false }).lean();
  }
  if (!before) return { ok: false, status: 409, error: 'این مبلغ قبلاً پرداخت شده یا دیگر قابل پرداخت نیست' };
  // مبلغ و شماره‌ی اقساط از سند قبل از تغییر (همان چیزی که واقعاً پرداخت شد)
  let amount = plan.amount, nos = plan.nos;
  if (plan.kind === 'all') {
    const rows = (before.installment?.schedule || []).filter((r) => r.status === 'due');
    amount = rows.reduce((s, r) => s + r.amount, 0); nos = rows.map((r) => r.no);
  }
  await Order.updateOne({ _id: oid }, { $push: { 'installment.payments': { ref, kind: plan.kind, nos, amount, at: now } } }).catch((e) => console.error('payment log:', e));
  return { ok: true, code: o.code, ref, amount, kind: plan.kind, nos };
}
