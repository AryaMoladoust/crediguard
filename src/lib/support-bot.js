import { POLICY, RISK_LABEL } from './credit-policy';
// پاسخ‌گوی خودکار پشتیبانی: فقط از «تنظیمات واقعی سیستم» و «داده‌ی واقعی خود مشتری» پاسخ می‌دهد.
// اگر مطمئن نباشد (یا موضوع نیازمند تصمیم انسانی باشد) مکالمه را به پشتیبان انسانی ارجاع می‌دهد.
const norm = (s) => String(s || '').replace(/[ي]/g, 'ی').replace(/[ك]/g, 'ک').replace(/[\u200c\u064b-\u0652]/g, ' ').replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/\s+/g, ' ').toLowerCase();
const fa = (n) => Math.round(n || 0).toLocaleString('fa-IR');
const jd = (d) => new Date(d).toLocaleDateString('fa-IR-u-ca-persian');
const has = (t, words) => words.filter((w) => t.includes(w)).length;

const INTENTS = [
  { id: 'human', words: ['اپراتور', 'پشتیبان انسان', 'با انسان', 'کارشناس', 'مدیر', 'شکایت', 'با یک نفر', 'صحبت با'], handoff: true },
  { id: 'overdue', words: ['معوق', 'دیرکرد', 'تاخیر', 'تأخیر', 'جریمه', 'بدهی', 'بدهکار', 'عقب افتاده', 'عقب‌افتاده'] },
  { id: 'pay', words: ['پرداخت قسط', 'قسط', 'اقساط', 'سررسید', 'پرداخت'] },
  { id: 'limit', words: ['سقف', 'اعتبار', 'امتیاز', 'ریسک', 'اعتبارسنجی', 'چقدر میتونم', 'چقدر می‌تونم', 'چقدر می توانم'] },
  { id: 'terms', words: ['شرایط', 'خرید اقساطی', 'پیش پرداخت', 'پیش‌پرداخت', 'چند ماه', 'مدت', 'چطور اقساطی', 'نحوه'] },
  { id: 'order', words: ['سفارش', 'پیگیری', 'ارسال', 'مرسوله', 'کی میرسه', 'کی می‌رسد'] },
  { id: 'account', words: ['رمز', 'پسورد', 'ورود', 'حساب', 'شماره موبایل', 'کد ملی', 'کدملی', 'کد تایید', 'کد تأیید', 'ثبت نام', 'ثبت‌نام'] },
  { id: 'hello', words: ['سلام', 'درود', 'وقت بخیر', 'صبح بخیر', 'عصر بخیر'], greet: true },
  { id: 'thanks', words: ['ممنون', 'مرسی', 'سپاس', 'تشکر'], greet: true }
];

// ctx: { user, assessment, decision, installments: summarizeInstallments(), orders }
export function answer(text, ctx) {
  const t = norm(text);
  const scored = INTENTS.map((i) => ({ i, n: has(t, i.words.map(norm)) })).filter((x) => x.n).sort((a, b) => b.n - a.n);
  // «قسط/پرداخت» عام‌تر از «معوق/شرایط» است؛ اولویت با ترتیب فهرست در مساوی بودن
  const top = scored[0]?.i;
  if (!top) return { intent: 'unknown', handoff: true, text: 'پرسش شما را متوجه نشدم و نمی‌خواهم پاسخ نادرست بدهم؛ مکالمه به پشتیبان انسانی ارجاع شد و در اولین فرصت پاسخ می‌دهد.' };
  const { installments: inst, assessment: a, orders = [] } = ctx;
  switch (top.id) {
    case 'hello': return { intent: 'hello', text: `سلام ${ctx.user.name} 👋 می‌توانید درباره‌ی شرایط خرید اقساطی، اعتبار و سقف خرید، پرداخت اقساط، بدهی معوق، سفارش‌ها یا مشکلات حساب بپرسید.` };
    case 'thanks': return { intent: 'thanks', text: 'خواهش می‌کنم! اگر سؤال دیگری دارید بنویسید.' };
    case 'human': return { intent: 'human', handoff: true, text: 'مکالمه به پشتیبان انسانی ارجاع شد. هر زمان پاسخ بدهد همین‌جا می‌بینید.' };
    case 'terms': return { intent: 'terms', text: `شرایط خرید اقساطی:\n• ورود به حساب، تأیید شماره موبایل و ثبت کد ملی لازم است.\n• مدت اقساط: ${POLICY.monthOptions.map(fa).join('، ')} ماه.\n• پیش‌پرداخت: ${POLICY.downPaymentOptions.map(fa).join('، ')} درصد قیمت.\n• مجموع اقساط ماهانه نباید از ${fa(POLICY.maxInstallmentToIncome * 100)}٪ درآمد منهای تعهدات فعلی بیشتر شود.\n• سقف اعتبار هر مشتری با بررسی اعتباری تعیین می‌شود (حداکثر ${fa(POLICY.maxCreditLimit)} تومان) و تأیید نهایی با مدیر است.\n• در این نسخه سود یا کارمزدی به اقساط اضافه نمی‌شود.` };
    case 'limit': {
      if (!a) return { intent: 'limit', text: 'هنوز بررسی اعتباری برای شما انجام نشده. از بخش «اعتبار و اقساط» در حساب کاربری، کد ملی و شماره موبایل را تأیید کنید تا سقف اعتبارتان محاسبه شود.' };
      return { intent: 'limit', text: `بر اساس بررسی اعتباری آزمایشی (داده‌ی شبیه‌سازی‌شده، نه بانک مرکزی): امتیاز ${fa(a.score)} از ۹۰۰، ریسک ${RISK_LABEL[a.riskLevel]} و سقف پیشنهادی ${fa(a.creditLimit)} تومان. جزئیات و دلایل در بخش «اعتبار و اقساط» حساب شما هست. تصمیم نهایی با قوانین سیستم و مدیر است.` };
    }
    case 'overdue': {
      if (!inst?.plans.length) return { intent: 'overdue', text: 'در حال حاضر قسط فعالی ندارید، پس بدهی معوقی ثبت نشده است.' };
      if (!inst.overdueCount) return { intent: 'overdue', text: `قسط معوقی ندارید. ${inst.next ? `قسط بعدی: ${fa(inst.next.amount)} تومان، سررسید ${jd(inst.next.dueDate)} (سفارش ${inst.next.code}).` : ''}` };
      return { intent: 'overdue', handoff: true, text: `${fa(inst.overdueCount)} قسط معوق به مبلغ ${fa(inst.overdueAmount)} تومان دارید. برای ترتیب پرداخت و هر موضوع مربوط به جریمه یا تمدید، مکالمه به پشتیبان انسانی ارجاع شد.` };
    }
    case 'pay': {
      if (!inst?.plans.length) return { intent: 'pay', text: 'قسط فعالی برای شما ثبت نشده. جدول اقساط پس از تأیید سفارش اقساطی توسط مدیر ساخته می‌شود.' };
      const n = inst.next;
      return { intent: 'pay', text: `${n ? `قسط بعدی شما ${fa(n.amount)} تومان با سررسید ${jd(n.dueDate)} است (سفارش ${n.code}).` : 'همه‌ی اقساط شما پرداخت شده یا معوق است.'}${inst.overdueCount ? ` ${fa(inst.overdueCount)} قسط معوق هم دارید.` : ''}\nپرداخت آنلاین قسط هنوز در سایت فعال نیست؛ پرداخت‌ها توسط پشتیبانی ثبت می‌شود و پس از ثبت، وضعیت قسط در بخش «اعتبار و اقساط» به‌روز می‌شود.` };
    }
    case 'order': {
      if (!orders.length) return { intent: 'order', text: 'سفارشی برای حساب شما ثبت نشده است.' };
      const L = { awaiting_payment: 'در انتظار پرداخت', pending: 'در انتظار تأیید', confirmed: 'تأییدشده', shipped: 'ارسال‌شده', completed: 'تحویل‌شده', cancelled: 'لغوشده' };
      return { intent: 'order', text: `آخرین سفارش‌های شما:\n${orders.slice(0, 3).map((o) => `• ${o.code}: ${L[o.status] || o.status} (${fa(o.total)} تومان)`).join('\n')}\nبرای جزئیات بیشتر از صفحه‌ی «پیگیری سفارش» استفاده کنید.` };
    }
    case 'account': return { intent: 'account', handoff: /کد ملی|کدملی|شماره موبایل/.test(t) && /تغییر|اشتباه|عوض|ویرایش/.test(t), text: /کد ملی|کدملی|شماره موبایل/.test(t) && /تغییر|اشتباه|عوض|ویرایش/.test(t)
      ? 'تغییر شماره موبایل یا کد ملی ثبت‌شده فقط با بررسی پشتیبان انجام می‌شود؛ مکالمه ارجاع شد.'
      : 'مشکلات حساب: رمز عبور را از «حساب کاربری ← تغییر رمز» عوض کنید (با تغییر رمز، ورودهای قبلی خارج می‌شوند). اگر کد تأیید نرسید یک دقیقه صبر کنید و دوباره بفرستید. اگر مشکل چیز دیگری است بنویسید تا به پشتیبان انسانی ارجاع دهم.' };
  }
}
