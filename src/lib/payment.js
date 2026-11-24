import Order, { AWAITING_PAYMENT } from '@/models/Order';
import Product from '@/models/Product';
import { PAY_WINDOW_SEC } from './auth';

export const payUrl = (token) => `/pay?t=${encodeURIComponent(token)}`;

// سفارش‌های نقدیِ پرداخت‌نشده بعد از ۳۰ دقیقه لغو می‌شوند و موجودی‌شان به انبار برمی‌گردد
// (شرط status روی خود سند، برگشت دوباره‌ی موجودی را غیرممکن می‌کند)
export async function releaseExpiredOrders() {
  const cutoff = new Date(Date.now() - PAY_WINDOW_SEC * 1000);
  for (let i = 0; i < 20; i++) {
    const o = await Order.findOneAndUpdate(
      { status: AWAITING_PAYMENT, createdAt: { $lt: cutoff } },
      { $set: { status: 'cancelled', 'payment.status': 'failed' } },
      { new: false }
    ).lean();
    if (!o) break;
    await Promise.all((o.items || []).map((x) => x.product && Product.updateOne({ _id: x.product }, { $inc: { stock: x.qty, sold: -x.qty } })));
  }
}
