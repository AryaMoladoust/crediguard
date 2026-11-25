// قاعده‌ی انتقال وضعیت سفارش (هم سمت سرور و هم در پنل استفاده می‌شود)
// pending → confirmed → shipped → completed ؛ لغو فقط تا پیش از ارسال ممکن است
// (بعد از ارسال، کالا از انبار خارج شده و برگرداندن خودکار موجودی درست نیست).
export const STATUS_LABEL = {
  pending: 'در انتظار',
  confirmed: 'تأییدشده',
  shipped: 'ارسال‌شده',
  completed: 'تکمیل‌شده',
  cancelled: 'لغوشده'
};
export const FLOW = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['shipped', 'cancelled'],
  shipped: ['completed'],
  completed: [],
  cancelled: []
};
// وضعیت‌هایی که ادمین می‌تواند تنظیم کند (awaiting_payment فقط توسط درگاه ساخته می‌شود)
export const ORDER_STATUSES = Object.keys(FLOW);
// وضعیت‌های بعدیِ مجاز از وضعیت فعلی
export const nextStatuses = (from) => FLOW[from] || [];
export const canTransition = (from, to) => nextStatuses(from).includes(to);
// وضعیت‌هایی که از آن‌ها می‌شود به «to» رفت (برای شرط اتمیک در دیتابیس)
export const statusesBefore = (to) => ORDER_STATUSES.filter((s) => FLOW[s].includes(to));
