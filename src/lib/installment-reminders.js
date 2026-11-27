import Order from '@/models/Order';
import Notification from '@/models/Notification';
import { PAYABLE } from './installments.js';

const DAY = 86400000;
const fa = (n) => Math.round(n || 0).toLocaleString('fa-IR');
const jDate = (d) => new Date(d).toLocaleDateString('fa-IR-u-ca-persian');

// اعلان‌های درون‌برنامه‌ای: سه روز مانده، روز سررسید و پس از سررسید.
// کلید یکتا مانع ایجاد اعلان تکراری در هر بار بازکردن صفحه می‌شود.
export async function syncInstallmentReminders(userId, now = new Date()) {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const until = new Date(today.getTime() + 3 * DAY);
  const orders = await Order.find({
    user: userId,
    method: 'installment',
    status: { $in: PAYABLE },
    'installment.down.status': 'paid',
    'installment.schedule.0': { $exists: true }
  }).select('code installment.schedule').lean();

  const writes = [];
  for (const order of orders) {
    for (const row of order.installment?.schedule || []) {
      if (row.status !== 'due' || !row.dueDate) continue;
      const due = new Date(row.dueDate);
      let stage, title, message;
      const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());
      if (due < now) {
        stage = 'overdue';
        const days = Math.max(1, Math.floor((now.getTime() - due.getTime()) / DAY));
        title = 'قسط معوق';
        message = `قسط شماره ${fa(row.no)} سفارش ${order.code} به مبلغ ${fa(row.amount)} تومان، از تاریخ ${jDate(due)} سررسید شده و ${fa(days)} روز از آن گذشته است. لطفاً پرداخت را انجام دهید.`;
      } else if (dueDay.getTime() === today.getTime()) {
        stage = 'today';
        title = 'سررسید قسط امروز';
        message = `قسط شماره ${fa(row.no)} سفارش ${order.code} به مبلغ ${fa(row.amount)} تومان، امروز (${jDate(due)}) سررسید می‌شود. برای پرداخت به بخش اعتبار و اقساط بروید.`;
      } else if (dueDay <= until) {
        stage = 'upcoming';
        const days = Math.max(1, Math.round((dueDay.getTime() - today.getTime()) / DAY));
        title = 'یادآوری سررسید قسط';
        message = `قسط شماره ${fa(row.no)} سفارش ${order.code} به مبلغ ${fa(row.amount)} تومان، ${fa(days)} روز دیگر در تاریخ ${jDate(due)} سررسید می‌شود.`;
      } else continue;

      const dateKey = due.toISOString().slice(0, 10);
      writes.push(Notification.updateOne(
        { dedupeKey: `installment:${order._id}:${row.no}:${dateKey}:${stage}` },
        { $setOnInsert: { user: userId, type: 'installment_reminder', title, message, link: '/account/credit', dedupeKey: `installment:${order._id}:${row.no}:${dateKey}:${stage}` } },
        { upsert: true }
      ));
    }
  }
  if (writes.length) await Promise.all(writes);
}
