import assert from 'node:assert/strict';
import { generateCreditData, generateBureauRecord } from '../src/lib/credit-sim.js';
import { analyzeCredit } from '../src/lib/credit-agent.js';
import { POLICY, planOf } from '../src/lib/credit-policy.js';
import { isValidNationalId, normalizeNationalId, maskNationalId } from '../src/lib/national-id.js';
import { answer } from '../src/lib/support-bot.js';
import { summarizeInstallments, planPayment, exposureFromOrders, purchaseCapacity, evaluateRequest, buildSchedule, downPaid } from '../src/lib/installments.js';

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

// ---- اقساط: خلاصه برای فروشنده/مشتری، پرداخت زودتر، تسویه‌ی همه، سقف تجمعی
const NOW = new Date('2026-11-27T12:00:00Z');
const at = (d) => new Date(NOW.getTime() + d * 86400000);
const row = (no, d, status = 'due', amount = 1_000_000) => ({ no, dueDate: at(d), amount, status });
const ord = (code, status, inst) => ({ _id: code, code, method: 'installment', status, total: 10_000_000, installment: { months: 4, downPayment: 2_000_000, financed: 8_000_000, monthly: 2_000_000, ...inst } });
const o1 = ord('A', 'confirmed', { down: { status: 'paid' }, schedule: [row(1, -40, 'paid'), row(2, -5), row(3, 25), row(4, 55)] });
const o2 = ord('B', 'confirmed', { down: { status: 'unpaid' }, schedule: [row(1, 3), row(2, 33)] });
const o3 = ord('C', 'pending', {});
const sum = summarizeInstallments([o1, o2, o3], NOW);
assert.equal(sum.totalCount, 6); assert.equal(sum.paidCount, 1); assert.equal(sum.remainingCount, 5);
assert.equal(sum.overdueCount, 1); assert.equal(sum.overdueAmount, 1_000_000); assert.equal(sum.maxDaysLate, 5);
assert.equal(sum.next.daysLeft, 3);
assert.equal(sum.downDueCount, 1); assert.equal(sum.downDueAmount, 2_000_000);
assert.equal(sum.awaiting.length, 1); assert.equal(sum.plans.find((p) => p.code === 'A').schedule[1].daysLate, 5);
assert.equal(summarizeInstallments([{ ...o1, status: 'cancelled' }], NOW).totalCount, 0);

// پرداخت: پیش‌پرداخت اول، بعد هر قسط در هر تاریخ، بعد تسویه‌ی همه؛ مبلغ از سفارش می‌آید
assert.equal(downPaid({}), true); // سفارش قدیمی بدون down قفل نمی‌شود
assert.equal(planPayment(o2, 'down').amount, 2_000_000);
assert.match(planPayment(o2, 'n1').error, /پیش‌پرداخت/);
assert.match(planPayment(o3, 'down').error, /تأیید/);
assert.equal(planPayment(o1, 'n3').amount, 1_000_000); // پرداخت زودتر (سررسید ۲۵ روز بعد)
assert.equal(planPayment(o1, 'n2').nos[0], 2);
assert.match(planPayment(o1, 'n1').error, /پرداخت شده/); // قسط پرداخت‌شده دوباره پرداخت نمی‌شود
assert.equal(planPayment(o1, 'all').amount, 3_000_000); assert.deepEqual(planPayment(o1, 'all').nos, [2, 3, 4]);
assert.match(planPayment(o1, 'down').error, /قبلاً/);
assert.ok(planPayment(o1, 'x9').error);

// سقف تجمعی: مانده‌ی اقساط باز + سفارش در انتظار از سقف کم می‌شود
const ex = exposureFromOrders([o1, o2, o3]);
assert.equal(ex.outstanding, 3_000_000 + 2_000_000 + 8_000_000);
const ass = { creditLimit: 20_000_000, recommendation: 'approve', metrics: { monthlyCapacity: 10_000_000 } };
const prof = { decision: { status: 'auto' } };
assert.equal(purchaseCapacity({ profile: prof, assessment: ass, exposure: ex }).available, 7_000_000);
assert.equal(purchaseCapacity({ profile: { decision: { status: 'rejected' } }, assessment: ass }).blocked, true);
assert.equal(evaluateRequest({ profile: prof, assessment: ass, total: 10_000_000, downPct: 10, months: 6, exposure: { outstanding: 0, monthly: 0 } }).ok, true);
assert.equal(evaluateRequest({ profile: prof, assessment: ass, total: 10_000_000, downPct: 10, months: 6, exposure: ex }).rule, 'over_limit');
const sched = buildSchedule({ months: 3, financed: 10_000_000, monthly: 3_333_000 }, NOW);
assert.equal(sched.reduce((s, r) => s + r.amount, 0), 10_000_000);

// مشتری هرگز امتیاز/ریسک/تحلیل ایجنت را از بات نمی‌شنود
const lim = answer('سقف اعتبار من چقدر است', { user: { name: 'ت' }, purchase: { limit: 20_000_000, available: 7_000_000, blocked: false } });
assert.equal(lim.intent, 'limit'); assert.ok(!/امتیاز|ریسک/.test(lim.text));

console.log('✔ domain tests passed (simulation, scoring, installment policy, installment payments, national ID, support bot)');
