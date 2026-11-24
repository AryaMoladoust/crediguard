import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import { connectDB } from '@/lib/db';
import Order from '@/models/Order';
export const metadata = { title: 'سفارش ثبت شد', robots: { index: false } };

export default async function Success({ searchParams }) {
  const sp = await searchParams;
  const code = /^ORD-\d{6}$/.test(String(sp.code)) ? sp.code : '';
  const inst = sp.method === 'installment';
  let paid = false; // وضعیت پرداخت از دیتابیس خوانده می‌شود، نه از آدرس صفحه
  if (code && !inst) { try { await connectDB(); paid = (await Order.findOne({ code }).select('payment.status').lean())?.payment?.status === 'paid'; } catch {} }
  return (
    <div className="wrap py-14">
      <div className="card mx-auto max-w-lg space-y-4 p-8 text-center">
        <CheckCircle2 size={56} className="mx-auto text-emerald-500" />
        <h1 className="text-2xl">{paid ? 'پرداخت با موفقیت انجام شد' : 'سفارش شما ثبت شد'}</h1>
        {code && <p className="text-sm text-ink-500">کد پیگیری: <b dir="ltr" className="mx-1 rounded-lg bg-ink-50 px-3 py-1 text-base text-ink">{code}</b></p>}
        <p className="text-sm leading-7 text-ink-500">{inst ? 'درخواست اقساطی شما ثبت شد و پس از بررسی اعتبار، کارشناسان با شما تماس می‌گیرند.' : paid ? 'پرداخت شما ثبت و سفارش به‌صورت خودکار تأیید شد. آماده‌سازی و ارسال به‌زودی انجام می‌شود.' : 'پرداخت این سفارش هنوز انجام نشده است؛ از صفحه‌ی پیگیری سفارش می‌توانید پرداخت را ادامه دهید.'} این کد را نگه دارید؛ برای پیگیری به شماره موبایل ثبت‌شده هم نیاز است.</p>
        <div className="flex flex-wrap justify-center gap-3 pt-2"><Link href="/track" className="btn btn-primary">پیگیری سفارش</Link><Link href="/products" className="btn btn-line">ادامه خرید</Link></div>
      </div>
    </div>
  );
}
