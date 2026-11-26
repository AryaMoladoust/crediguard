import { createHash } from 'node:crypto';
// شبیه‌ساز قطعی (Deterministic) اطلاعات اعتباری: خروجی فقط تابع شناسه‌ی داخلی مشتری و نسخه‌ی شبیه‌ساز است.
export const SIM_VERSION = 1;
function rng(seedStr) {
  let a = createHash('sha256').update(seedStr).digest().readUInt32LE(0);
  return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const INCOMES = [10, 12, 15, 18, 22, 28, 35, 50, 70, 100];
export function generateCreditData(userId, version = SIM_VERSION) {
  const R = rng(`credit-sim:v${version}:${userId}`);
  const int = (a, b) => a + Math.floor(R() * (b - a + 1));
  const pois = (l) => { let n = 0, p = Math.exp(-l), c = p; const u = R(); while (u > c && n < 20) { n++; p *= l / n; c += p; } return n; };
  const trust = (R() + R() + R()) / 3; // قابلیت اعتماد پنهان ۰..۱
  const income = Math.round(INCOMES[int(0, 9)] * 1e6 * (0.8 + R() * 0.4) / 1e5) * 1e5;
  const activeLoans = pois(1.3 * (1.5 - trust));
  const hasChequebook = R() < 0.55;
  const bounced = hasChequebook ? pois(3 * (1 - trust) ** 2) : 0;
  const overdue = pois(2.6 * (1 - trust) ** 2);
  const onTime = int(4, 40);
  const late = Math.min(onTime, pois(4 * (1 - trust) ** 1.5) + overdue);
  const obligations = Math.round(income * (0.05 + R() * 0.5) * (activeLoans === 0 ? 0.3 : 1) / 1e5) * 1e5;
  return {
    monthlyIncome: income,
    accountBalance: Math.round(income * (0.2 + R() * 2.3) * (0.4 + trust) / 1e5) * 1e5,
    accountAgeMonths: int(6, 180),
    recentInquiries: pois(0.8 + 5 * (1 - trust) ** 2),
    activeLoans, monthlyObligations: obligations,
    totalDebt: Math.round(obligations * (activeLoans ? int(3, 18) : 0) / 1e5) * 1e5,
    overdueInstallments: overdue,
    maxDelayDays: overdue === 0 ? 0 : [5, 12, 30, 45, 90][int(0, 4)],
    everDefaulted: R() < (1 - trust) ** 2 * 0.6,
    onTimePayments: onTime, latePayments: late,
    goodStandingPct: Math.round((onTime / (onTime + late)) * 100),
    hasChequebook, bouncedCheques: bounced,
    blacklisted: trust < 0.2 && R() < 0.4
  };
}
// فیلدهای قابل ویرایش توسط مدیر (با بازه‌ی مجاز) برای به‌روزرسانی کنترل‌شده‌ی داده‌ی آزمایشی
export const EDITABLE = {
  monthlyIncome: [1e6, 1e9], accountBalance: [0, 1e10], monthlyObligations: [0, 1e9], totalDebt: [0, 1e10],
  activeLoans: [0, 20], overdueInstallments: [0, 36], maxDelayDays: [0, 365], bouncedCheques: [0, 30],
  onTimePayments: [0, 240], latePayments: [0, 240], recentInquiries: [0, 30], accountAgeMonths: [0, 600]
};
export const EDITABLE_BOOL = ['everDefaulted', 'blacklisted', 'hasChequebook'];
export const FIELD_LABEL = {
  monthlyIncome: 'درآمد ماهانه', accountBalance: 'موجودی حساب (فرضی)', monthlyObligations: 'تعهدات ماهانه', totalDebt: 'مجموع بدهی',
  activeLoans: 'تسهیلات فعال', overdueInstallments: 'اقساط معوق', maxDelayDays: 'حداکثر تأخیر (روز)', bouncedCheques: 'چک برگشتی',
  onTimePayments: 'اقساط به‌موقع', latePayments: 'اقساط با تأخیر', recentInquiries: 'استعلام ۶ماهه', accountAgeMonths: 'عمر حساب (ماه)',
  everDefaulted: 'سابقه‌ی نکول', blacklisted: 'فهرست سیاه', hasChequebook: 'دسته‌چک دارد', goodStandingPct: 'خوش‌حسابی (٪)'
};

// ---- رکورد «مثل بانک مرکزی»: هم‌شکل با خروجی اسکریپت scripts/gen_credit_bureau.py، کاملاً مصنوعی و تصادفی.
// اعداد مالی از همان data موتور اعتبارسنجی گرفته می‌شود تا دو نسخه با هم ناسازگار نباشند؛ فقط اطلاعات هویتی/جغرافیایی تصادفی اضافه می‌شود.
const EMPLOYMENT = ['کارمند', 'آزاد', 'کارگر', 'بازنشسته', 'دانشجو', 'شغل‌دار-خصوصی'];
const PLACES = {
  'تهران': ['تهران', 'شهریار', 'ری', 'اسلامشهر'], 'اصفهان': ['اصفهان', 'کاشان', 'نجف‌آباد'], 'خراسان رضوی': ['مشهد', 'نیشابور', 'سبزوار'],
  'فارس': ['شیراز', 'مرودشت', 'جهرم'], 'آذربایجان شرقی': ['تبریز', 'مراغه'], 'خوزستان': ['اهواز', 'دزفول', 'آبادان'],
  'البرز': ['کرج', 'فردیس'], 'مازندران': ['ساری', 'بابل', 'آمل'], 'گیلان': ['رشت', 'انزلی'], 'کرمانشاه': ['کرمانشاه'], 'یزد': ['یزد'],
  'کرمان': ['کرمان', 'رفسنجان'], 'همدان': ['همدان'], 'قم': ['قم'], 'هرمزگان': ['بندرعباس'], 'اردبیل': ['اردبیل']
};
const STREETS = ['ولیعصر', 'بهار', 'شهید بهشتی', 'امام خمینی', 'آزادی', 'انقلاب', 'سعدی', 'فردوسی', 'مطهری', 'ملاصدرا', 'کارگر', 'گلستان'];

export function generateBureauRecord(userId, { fullName = '', mobile = '', data } = {}, version = SIM_VERSION) {
  const d = data || generateCreditData(userId, version);
  const R = rng(`bureau-demo:v${version}:${userId}`);
  const int = (a, b) => a + Math.floor(R() * (b - a + 1));
  const pick = (arr) => arr[int(0, arr.length - 1)];
  const province = pick(Object.keys(PLACES)); const city = pick(PLACES[province]);
  const chequeScore = d.hasChequebook ? Math.max(1, Math.min(100, Math.round(100 - d.bouncedCheques * 13 - int(0, 15) - (d.goodStandingPct < 70 ? 20 : 0)))) : null;
  return {
    mobile, fullName,
    birthYearJalali: int(1350, 1385), employment: pick(EMPLOYMENT), province, city,
    address: `${city}، خیابان ${pick(STREETS)}، کوچه ${int(1, 40)}، پلاک ${int(1, 120)}`,
    declaredMonthlyIncome: d.monthlyIncome, accountAgeMonths: d.accountAgeMonths,
    avgAccountBalance6m: d.accountBalance, recentInquiries6m: d.recentInquiries,
    blacklisted: d.blacklisted,
    loans: { activeLoans: d.activeLoans, monthlyObligations: d.monthlyObligations, overdueInstallments: d.overdueInstallments, maxDelayDays: d.maxDelayDays, everDefaulted: d.everDefaulted },
    cheque: { hasChequebook: d.hasChequebook, bouncedLast5y: d.bouncedCheques, chequeScore },
    synthetic: true
  };
}
