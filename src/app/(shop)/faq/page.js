import Link from 'next/link';
import { SITE } from '@/lib/site';
export const metadata = { title: 'پرسش‌های متداول' };
const FAQ = [
  ['چطور سفارش بدهم؟', 'کالا را به سبد خرید اضافه کنید، در صفحه‌ی «تکمیل سفارش» نام، شماره موبایل و آدرس را وارد کنید و سفارش را ثبت کنید. ساخت حساب کاربری اجباری نیست.'],
  ['از کجا بفهمم سفارشم به کجا رسید؟', 'در صفحه‌ی «پیگیری سفارش» کد سفارش و شماره موبایل را وارد کنید. اگر حساب کاربری دارید، همه‌ی سفارش‌ها در بخش «حساب من» دیده می‌شود.'],
  ['خرید اقساطی چگونه است؟', 'هنگام ثبت سفارش «درخواست خرید اقساطی» را انتخاب کنید. پس از بررسی اعتبار، کارشناسان برای هماهنگی شرایط با شما تماس می‌گیرند.'],
  ['هزینه ارسال چقدر است؟', `برای سفارش‌های بالای ${(SITE.freeShipping / 1_000_000).toLocaleString('fa-IR')} میلیون تومان ارسال رایگان است؛ در غیر این صورت هزینه‌ی ارسال هنگام هماهنگی اعلام می‌شود.`],
  ['اگر کالا را نپسندیدم؟', 'تا ۷ روز پس از تحویل، در صورت سالم بودن کالا و بسته‌بندی می‌توانید درخواست بازگشت بدهید.'],
  ['پرداخت آنلاین دارید؟', 'در حال حاضر پرداخت پس از ثبت سفارش و با هماهنگی پشتیبانی انجام می‌شود.']
];
export default function Faq() {
  return (
    <div className="wrap py-10"><div className="mx-auto max-w-3xl">
      <h1 className="text-2xl sm:text-3xl">پرسش‌های متداول</h1>
      <div className="mt-6 space-y-3">{FAQ.map(([q, a]) => <details key={q} className="card group p-5"><summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-bold">{q}<span className="text-xl text-brand transition group-open:rotate-45" aria-hidden>+</span></summary><p className="mt-3 text-sm leading-8 text-ink-500">{a}</p></details>)}</div>
      <p className="mt-8 text-sm text-ink-500">پاسخ پرسشتان را پیدا نکردید؟ <Link href="/contact" className="font-bold text-brand-600">با ما تماس بگیرید</Link>.</p>
    </div></div>
  );
}
