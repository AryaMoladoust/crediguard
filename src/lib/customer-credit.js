import Order from '@/models/Order';
import { runAssessment, summarizeInstallments } from './credit-service';
import { SIM_NOTICE } from './credit-policy';

// داده‌ی اعتباری/اقساط «خود مشتری» (کاملاً بر اساس شناسه‌ی کاربر نشست؛ هیچ شناسه‌ای از کلاینت پذیرفته نمی‌شود)
export async function customerCredit(user, { assess = true } = {}) {
  const orders = await Order.find({ $or: [{ user: user.id }, { 'customer.phone': user.phone, user: { $exists: false } }], status: { $ne: 'awaiting_payment' } }).sort({ createdAt: -1 }).limit(50).lean();
  const installments = summarizeInstallments(orders);
  const ready = !!(user.nationalIdMasked && user.phoneVerified);
  if (!ready || !assess) return { ready, installments, orders };
  const { profile, assessment } = await runAssessment(user.id, 'customer');
  return { ready, installments, orders, profile, assessment, notice: SIM_NOTICE };
}
export const publicAssessment = (a) => a && ({ score: a.score, riskLevel: a.riskLevel, creditLimit: a.creditLimit, recommendation: a.recommendation, summary: a.summary, reasons: a.reasons, flags: a.flags, metrics: a.metrics, engine: a.engine, at: a.createdAt, synthetic: true });
