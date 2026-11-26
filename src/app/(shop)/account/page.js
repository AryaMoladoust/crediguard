import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Package } from 'lucide-react';
import { getUser } from '@/lib/user-session';
import { connectDB } from '@/lib/db';
import Order from '@/models/Order';
import ProfileForm from '@/components/ProfileForm';
import AccountNav from '@/components/AccountNav';
import { ORDER_STATUS, METHOD_LABEL, fmtDate } from '@/lib/format';

export const metadata = { title: 'حساب کاربری' };
export const dynamic = 'force-dynamic';

export default async function Account() {
  const user = await getUser();
  if (!user) redirect('/account/login');
  let orders = [];
  try { await connectDB(); orders = await Order.find({ $or: [{ user: user.id }, { 'customer.phone': user.phone }] }).sort({ createdAt: -1 }).limit(50).lean(); } catch {}
  return (
    <div className="wrap py-8">
      <h1 className="text-2xl sm:text-3xl">سلام، {user.name}</h1>
      <AccountNav active="/account" />
      <div className="mt-6 grid gap-6 lg:grid-cols-[22rem_1fr]">
        <ProfileForm user={user} />
        <section className="card p-5 sm:p-6">
          <h2 className="text-lg">سفارش‌های من</h2>
          {orders.length ? (
            <ul className="mt-4 divide-y divide-ink-100">{orders.map((o) => (
              <li key={String(o._id)} className="flex flex-wrap items-center justify-between gap-3 py-4">
                <div className="min-w-0"><b dir="ltr" className="block text-sm">{o.code}</b><small className="text-ink-500">{fmtDate(o.createdAt)} · {METHOD_LABEL[o.method]} · {(o.items || []).length.toLocaleString('fa-IR')} قلم کالا</small></div>
                <div className="flex items-center gap-3"><b className="text-sm">{(o.total || 0).toLocaleString('fa-IR')} تومان</b>
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${o.status === 'cancelled' ? 'bg-red-50 text-red-700' : o.status === 'completed' ? 'bg-emerald-50 text-emerald-700' : 'bg-brand-50 text-brand-700'}`}>{(ORDER_STATUS[o.status] || ORDER_STATUS.pending).label}</span></div>
              </li>))}</ul>
          ) : <div className="mt-6 grid place-items-center gap-3 py-10 text-center"><Package size={40} className="text-ink-400" /><p className="text-sm text-ink-500">هنوز سفارشی ثبت نکرده‌اید.</p><Link href="/products" className="btn btn-primary">شروع خرید</Link></div>}
        </section>
      </div>
    </div>
  );
}
