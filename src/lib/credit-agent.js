import { POLICY, RISK_LABEL, roundTo } from './credit-policy.js';
// «ایجنت اعتبارسنج اعتبار یار» — موتور تحلیل قاعده‌محور و قابل‌توضیح (rules-v1).
// فقط امتیاز، ریسک و پیشنهاد قابل‌توضیح تولید می‌کند؛ تصمیم خودکار/ارجاع به مدیر در لایه‌ی قوانین درخواست اقساط اعمال می‌شود.
// برای اتصال به مدل/سرویس بیرونی، همین ورودی/خروجی را حفظ کنید.
export const ENGINE = 'rules-v1';
const fa = (n) => Math.round(n).toLocaleString('fa-IR');

export function analyzeCredit(d) {
  const reasons = [];
  let score = 600;
  const add = (label, delta) => { if (delta) { score += delta; reasons.push({ label, delta }); } };
  const flags = [];
  const flag = (code, severity, text) => flags.push({ code, severity, text });

  const paid = d.onTimePayments + d.latePayments;
  const ratio = paid ? d.onTimePayments / paid : 0.7;
  add(`نرخ پرداخت به‌موقع اقساط ${fa(ratio * 100)}٪`, Math.round((ratio - 0.7) * 300));
  if (d.overdueInstallments) { add(`${fa(d.overdueInstallments)} قسط معوق`, -Math.min(140, d.overdueInstallments * 35)); flag('overdue', d.overdueInstallments >= 3 ? 'high' : 'medium', `${fa(d.overdueInstallments)} قسط معوق با حداکثر ${fa(d.maxDelayDays)} روز تأخیر`); }
  if (d.maxDelayDays >= 90) add('تأخیر بیش از ۹۰ روز', -80); else if (d.maxDelayDays >= 30) add('تأخیر بیش از ۳۰ روز', -40);
  if (d.everDefaulted) { add('سابقه‌ی نکول تسهیلات', -120); flag('default', 'high', 'سابقه‌ی نکول در تسهیلات قبلی'); }
  if (d.bouncedCheques) { add(`${fa(d.bouncedCheques)} چک برگشتی`, -Math.min(120, d.bouncedCheques * 30)); flag('bounced', d.bouncedCheques >= 2 ? 'high' : 'medium', `${fa(d.bouncedCheques)} چک برگشتی در ۵ سال اخیر`); }
  else if (d.hasChequebook) add('دسته‌چک بدون برگشتی', 15);
  const dti = d.monthlyIncome ? d.monthlyObligations / d.monthlyIncome : 1;
  if (dti > 0.5) { add(`تعهدات ماهانه ${fa(dti * 100)}٪ درآمد`, -90); flag('dti', 'high', 'نسبت تعهدات به درآمد بسیار بالا است'); }
  else if (dti > 0.35) add(`تعهدات ماهانه ${fa(dti * 100)}٪ درآمد`, -45);
  else if (dti < 0.2) add(`تعهدات ماهانه فقط ${fa(dti * 100)}٪ درآمد`, 40);
  const cover = d.monthlyIncome ? d.accountBalance / d.monthlyIncome : 0;
  if (cover >= 1) add('موجودی حساب حداقل یک برابر درآمد ماهانه', 40); else if (cover < 0.3) add('موجودی حساب کمتر از ۰٫۳ درآمد ماهانه', -25);
  if (d.accountAgeMonths >= 60) add('سابقه‌ی حساب بیش از ۵ سال', 30); else if (d.accountAgeMonths < 12) add('حساب کمتر از یک سال سابقه دارد', -20);
  if (d.recentInquiries >= 4) { add(`${fa(d.recentInquiries)} استعلام در ۶ ماه اخیر`, -30); flag('inquiries', d.recentInquiries >= 6 ? 'high' : 'medium', 'تعداد استعلام‌های اخیر غیرعادی است'); }
  if (d.activeLoans >= 4) flag('many_loans', 'medium', `${fa(d.activeLoans)} تسهیلات فعال هم‌زمان`);
  if (d.recentInquiries >= 5 && d.overdueInstallments >= 1 && cover < 0.5) flag('risk_pattern', 'high', 'ترکیب استعلام زیاد، قسط معوق و موجودی کم؛ نشانه‌ی رفتار پرریسک');
  if (d.blacklisted) { add('حضور در فهرست سیاه', -300); flag('blacklisted', 'critical', 'مشتری در فهرست سیاه (آزمایشی) است'); }

  score = Math.max(300, Math.min(900, Math.round(score)));
  const riskLevel = d.blacklisted || score < 480 ? 'critical' : score < 600 ? 'high' : score < 720 ? 'medium' : 'low';

  // سقف اعتبار: ظرفیت ماهانه × مدت مجاز بر اساس ریسک، با سقف نسبت به درآمد و سقف سیستمی
  const capacity = Math.max(0, d.monthlyIncome * POLICY.maxInstallmentToIncome - d.monthlyObligations);
  const months = { low: 12, medium: 9, high: 6, critical: 0 }[riskLevel];
  const factor = { low: 1, medium: 0.8, high: 0.5, critical: 0 }[riskLevel];
  const limit = d.blacklisted ? 0 : roundTo(Math.min(capacity * months * factor, d.monthlyIncome * 8, POLICY.maxCreditLimit));

  let recommendation = 'review';
  if (d.blacklisted || score < POLICY.rejectMaxScore || limit === 0 || d.overdueInstallments >= 4) recommendation = 'reject';
  else if (score >= POLICY.approveMinScore && !flags.some((f) => f.severity === 'high' || f.severity === 'critical')) recommendation = 'approve';

  const top = [...reasons].sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta)).slice(0, 3).map((r) => r.label);
  const summary = `امتیاز ${fa(score)} از ۹۰۰، ریسک ${RISK_LABEL[riskLevel]}، سقف پیشنهادی ${fa(limit)} تومان. مهم‌ترین عوامل: ${top.join('، ') || '—'}.`;
  return { engine: ENGINE, score, riskLevel, creditLimit: limit, recommendation, reasons, flags, summary, metrics: { dti: Math.round(dti * 1000) / 1000, monthlyCapacity: Math.round(capacity), balanceCover: Math.round(cover * 100) / 100 } };
}
