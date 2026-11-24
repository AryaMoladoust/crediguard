import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
export const metadata = { title: 'سفارش ثبت شد', robots: { index: false } };

export default async function Success({ searchParams }) {
  const sp = await searchParams;
  const code = /^ORD-\d{6}$/.test(String(sp.code)) ? sp.code : '';
  const inst = sp.method === 'installment';
  return (
    <div className="wrap py-14">
      <div className="card mx-auto max-w-lg space-y-4 p-8 text-center">
        <CheckCircle2 size={56} className="mx-auto text-emerald-500" />
        <h1 className="text-2xl">سفارش شما ثبت شد</h1>
        {code && <p className="text-sm text-ink-500">کد پیگیری: <b dir="ltr" className="mx-1 rounded-lg bg-ink-50 px-3 py-1 text-base text-ink">{code}</b></p>}
        <p className="text-sm leading-7 text-ink-500">{inst ? 'درخواست اقساطی شما ثبت شد و پس از بررسی اعتبار، کارشناسان با شما تماس می‌گیرند.' : 'برای هماهنگی پرداخت و ارسال، به‌زودی با شما تماس می‌گیریم.'} این کد را نگه دارید؛ برای پیگیری به شماره موبایل ثبت‌شده هم نیاز است.</p>
        <div className="flex flex-wrap justify-center gap-3 pt-2"><Link href="/track" className="btn btn-primary">پیگیری سفارش</Link><Link href="/products" className="btn btn-line">ادامه خرید</Link></div>
      </div>
    </div>
  );
}
