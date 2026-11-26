import Link from 'next/link';
import { redirect } from 'next/navigation';
import { connectDB } from '@/lib/db';
import Order, { AWAITING_PAYMENT } from '@/models/Order';
import { verifyPayToken, verifyInstToken, PAY_WINDOW_SEC } from '@/lib/auth';
import { planPayment } from '@/lib/installments.js';
import { releaseExpiredOrders } from '@/lib/payment';
import GatewaySim from '@/components/GatewaySim';
export const metadata = { title: 'درگاه پرداخت', robots: { index: false } };
export const dynamic = 'force-dynamic';

const Msg = ({ title, text, back }) => (
  <div className="wrap py-14"><div className="card mx-auto max-w-md space-y-3 p-8 text-center">
    <h1 className="text-xl">{title}</h1><p className="text-sm leading-7 text-ink-500">{text}</p>
    <div className="flex flex-wrap justify-center gap-3 pt-2">{back ? <Link href={back} className="btn btn-primary">بازگشت به اعتبار و اقساط</Link> : <Link href="/track" className="btn btn-primary">پیگیری سفارش</Link>}<Link href="/products" className="btn btn-line">بازگشت به فروشگاه</Link></div>
  </div></div>
);

export default async function PayPage({ searchParams }) {
  const sp = await searchParams;
  const token = typeof sp.t === 'string' ? sp.t : '';
  if (token.startsWith('q1.')) { // پرداخت اقساط (پیش‌پرداخت / زودتر / همه)
    const t = await verifyInstToken(token, process.env.SESSION_SECRET);
    if (!t) return <Msg back="/account/credit" title="لینک پرداخت نامعتبر یا منقضی است" text="از صفحه‌ی «اعتبار و اقساط» دوباره روی دکمه‌ی پرداخت بزنید." />;
    await connectDB();
    const o = await Order.findById(t.oid).select('code method status installment').lean();
    const plan = planPayment(o, t.target);
    if (plan.error) return <Msg back="/account/credit" title="این پرداخت دیگر ممکن نیست" text={plan.error} />;
    return <GatewaySim token={token} code={o.code} total={plan.amount} label={plan.label} returnTo="/account/credit?paid=1" expiresAt={t.exp * 1000} />;
  }
  const oid = await verifyPayToken(token, process.env.SESSION_SECRET);
  if (!oid) return <Msg title="لینک پرداخت نامعتبر یا منقضی است" text="برای ادامه‌ی پرداخت از صفحه‌ی پیگیری سفارش (با کد سفارش و شماره موبایل) وارد شوید." />;
  await connectDB();
  await releaseExpiredOrders().catch(() => {});
  const o = await Order.findById(oid).select('code total status payment createdAt').lean();
  if (!o) return <Msg title="سفارش پیدا نشد" text="این سفارش وجود ندارد." />;
  if (o.payment?.status === 'paid') redirect(`/order/success?code=${o.code}&method=cash`);
  if (o.status !== AWAITING_PAYMENT) return <Msg title="این سفارش دیگر قابل پرداخت نیست" text="مهلت پرداخت (۳۰ دقیقه) تمام شده یا سفارش لغو شده است. می‌توانید دوباره سفارش بدهید." />;
  return <GatewaySim token={token} code={o.code} total={o.total} expiresAt={new Date(o.createdAt).getTime() + PAY_WINDOW_SEC * 1000} />;
}
