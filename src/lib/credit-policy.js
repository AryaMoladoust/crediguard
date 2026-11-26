// تنظیمات واقعی سیستم اعتبار: منبع یگانه برای فرم پرداخت، قوانین سرور، ایجنت و پاسخ‌های پشتیبانی.
export const POLICY = {
  monthOptions: [3, 6, 9, 12],
  downPaymentOptions: [10, 20, 30, 40], // درصد
  minDownPaymentPct: 10,
  maxInstallmentToIncome: 0.4, // سقف مجموع اقساط ماهانه نسبت به درآمد اعلامی
  firstDueAfterDays: 30,
  maxCreditLimit: 150_000_000, // تومان
  approveMinScore: 640,
  rejectMaxScore: 450,
  assessmentLabel: 'داده آزمایشی (شبیه‌سازی‌شده)'
};
export const SIM_NOTICE = 'این اطلاعات آزمایشی و شبیه‌سازی‌شده است و از بانک مرکزی یا هیچ سرویس اعتبارسنجی واقعی دریافت نشده.';
export const RISK_LABEL = { low: 'کم', medium: 'متوسط', high: 'بالا', critical: 'بحرانی' };
export const DECISION_LABEL = { approve: 'تأیید', review: 'نیازمند بررسی', reject: 'رد' };
export const roundTo = (n, step = 500_000) => Math.max(0, Math.floor(n / step) * step);
// قسط ماهانه‌ی خرید اقساطی (بدون سود؛ سود/کارمزد در این نسخه تعریف نشده است)
export function planOf(total, downPct, months) {
  const downPayment = Math.round((total * downPct) / 100 / 1000) * 1000;
  const financed = total - downPayment;
  return { downPct, downPayment, financed, months, monthly: Math.ceil(financed / months / 1000) * 1000 };
}
