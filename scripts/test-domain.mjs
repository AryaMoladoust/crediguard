import assert from 'node:assert/strict';
import { generateCreditData, generateBureauRecord } from '../src/lib/credit-sim.js';
import { analyzeCredit } from '../src/lib/credit-agent.js';
import { POLICY, planOf } from '../src/lib/credit-policy.js';
import { isValidNationalId, normalizeNationalId, maskNationalId } from '../src/lib/national-id.js';
import { answer } from '../src/lib/support-bot.js';

// داده‌ی شبیه‌سازی‌شده باید برای یک شناسه پایدار و برای شناسه‌های دیگر مستقل باشد.
const one = generateCreditData('customer-a');
assert.deepEqual(generateCreditData('customer-a'), one);
assert.notDeepEqual(generateCreditData('customer-b'), one);
assert.equal(typeof one.accountBalance, 'number');

// رکورد «مثل بانک مرکزی»: پایدار، مصنوعی، هم‌شکل با فیلدهای موردنیاز و سازگار با data موتور.
const b1 = generateBureauRecord('customer-a', { fullName: 'تست', mobile: '09120000000', data: one });
assert.deepEqual(generateBureauRecord('customer-a', { fullName: 'تست', mobile: '09120000000', data: one }), b1);
assert.equal(b1.synthetic, true);
for (const k of ['mobile', 'fullName', 'birthYearJalali', 'employment', 'province', 'city', 'address', 'declaredMonthlyIncome', 'accountAgeMonths', 'avgAccountBalance6m', 'recentInquiries6m', 'blacklisted', 'loans', 'cheque']) assert.ok(k in b1, k);
for (const k of ['activeLoans', 'monthlyObligations', 'overdueInstallments', 'maxDelayDays', 'everDefaulted']) assert.ok(k in b1.loans, k);
for (const k of ['hasChequebook', 'bouncedLast5y', 'chequeScore']) assert.ok(k in b1.cheque, k);
assert.equal(b1.declaredMonthlyIncome, one.monthlyIncome);
assert.ok(b1.birthYearJalali >= 1350 && b1.birthYearJalali <= 1385);

// خروجی ایجنت باید در محدوده و دارای توضیح باشد.
const assessment = analyzeCredit(one);
assert.ok(assessment.score >= 300 && assessment.score <= 900);
assert.ok(['low', 'medium', 'high', 'critical'].includes(assessment.riskLevel));
assert.ok(['approve', 'review', 'reject'].includes(assessment.recommendation));
assert.ok(assessment.summary.length > 10);
assert.ok(Array.isArray(assessment.reasons));

// محاسبه‌ی برنامه‌ی اقساط و محدودیت‌های سیاست.
assert.deepEqual(POLICY.monthOptions, [3, 6, 9, 12]);
const plan = planOf(12_000_000, 20, 6);
assert.equal(plan.downPayment, 2_400_000);
assert.equal(plan.financed, 9_600_000);
assert.equal(plan.monthly, 1_600_000);

// اعتبارسنجی کد ملی و نرمال‌سازی ارقام فارسی.
assert.equal(normalizeNationalId('۱۰۰۰۰۰۰۰۰۱'), '1000000001');
assert.equal(isValidNationalId('1000000001'), true);
assert.equal(isValidNationalId('1111111111'), false);
assert.equal(maskNationalId('1000000001'), '100****001');

// بات باید از تنظیمات واقعی policy پاسخ دهد و در موارد ناشناخته ارجاع کند.
const faq = answer('شرایط خرید اقساطی چیست؟', { user: { name: 'آزمایشی' } });
assert.equal(faq.intent, 'terms');
assert.ok(faq.text.includes('۳، ۶، ۹، ۱۲'));
const unknown = answer('سؤال نامرتبط و ناشناخته', { user: { name: 'آزمایشی' } });
assert.equal(unknown.handoff, true);
assert.equal(unknown.intent, 'unknown');

console.log('✔ domain tests passed (simulation, scoring, installment policy, national ID, support bot)');
