import Order from '@/models/Order';
import { runAssessment, summarizeInstallments, exposureFromOrders, purchaseCapacity } from './credit-service';

// داده‌ی اقساط «خود مشتری» (کاملاً بر اساس شناسه‌ی کاربر نشست؛ هیچ شناسه‌ای از کلاینت پذیرفته نمی‌شود)
export async function customerCredit(user, { assess = true } = {}) {
  const orders = await Order.find({ $or: [{ user: user.id }, { 'customer.phone': user.phone, user: { $exists: false } }], status: { $ne: 'awaiting_payment' } }).sort({ createdAt: -1 }).limit(50).lean();
  const installments = summarizeInstallments(orders);
  const ready = !!user.nationalIdMasked;
  if (!ready || !assess) return { ready, installments, orders };
  const { profile, assessment } = await runAssessment(user.id, 'customer');
  const exposure = exposureFromOrders(orders.filter((o) => o.user && String(o.user) === String(user.id)));
  // profile/assessment فقط سمت سرور می‌مانند (پنل فروشنده و بات)؛ به مشتری فقط purchase داده می‌شود
  return { ready, installments, orders, profile, assessment, purchase: purchaseCapacity({ profile, assessment, exposure }) };
}
